from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

try:
    import tensorflow as tf
except Exception:  # TensorFlow can be absent during lightweight health checks.
    tf = None


class DDoSModelService:
    """Loads the trained project artifacts and runs all three project models."""

    def __init__(self, model_dir: Path, results_dir: Path):
        self.model_dir = Path(model_dir)
        self.results_dir = Path(results_dir)

        self.load_errors: dict[str, str] = {}
        self.features = self._read_json(self.model_dir / "feature_columns.json", [])
        self.config = self._read_json(self.model_dir / "model_config.json", {})
        self.threshold_info = self._read_json(
            self.model_dir / "autoencoder_threshold.json", {}
        )
        self.metrics = self._read_json(
            self.results_dir / "final_metrics.json",
            self._read_json(self.results_dir / "metrics.json", {}),
        )

        self.sequence_length = int(self.config.get("lstm_sequence_length", 8))
        self.autoencoder_threshold = float(
            self.threshold_info.get(
                "autoencoder_threshold",
                self.config.get("autoencoder_threshold", 0.0),
            )
        )

        self.scaler = self._load_joblib("scaler.joblib", "standard_scaler.joblib")
        self.logistic = self._load_joblib("logistic_regression.joblib")
        self.lstm = self._load_keras("lstm_model.keras", "lstm_model_final.keras")
        self.autoencoder = self._load_keras(
            "autoencoder_model.keras", "autoencoder_model_final.keras"
        )

    @staticmethod
    def _read_json(path: Path, default: Any):
        if not path.exists():
            return default
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _load_joblib(self, *names: str):
        for name in names:
            path = self.model_dir / name
            if path.exists():
                try:
                    return joblib.load(path)
                except Exception as exc:
                    self.load_errors[name] = str(exc)
        return None

    def _load_keras(self, *names: str):
        if tf is None:
            self.load_errors["tensorflow"] = "TensorFlow could not be imported."
            return None
        for name in names:
            path = self.model_dir / name
            if path.exists():
                try:
                    return tf.keras.models.load_model(path, compile=False)
                except Exception as exc:
                    self.load_errors[name] = str(exc)
        return None

    @property
    def ready(self) -> bool:
        return bool(self.features) and self.scaler is not None and self.logistic is not None

    def status(self) -> dict[str, Any]:
        return {
            "feature_count": len(self.features),
            "sequence_length": self.sequence_length,
            "autoencoder_threshold": self.autoencoder_threshold,
            "models": {
                "logistic_regression": self.logistic is not None,
                "lstm": self.lstm is not None,
                "autoencoder": self.autoencoder is not None,
                "scaler": self.scaler is not None,
            },
            "tensorflow_available": tf is not None,
            "load_errors": self.load_errors,
        }

    def _clean_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        cleaned = df.copy()
        cleaned.columns = [str(c).replace("\ufeff", "").strip() for c in cleaned.columns]
        return cleaned

    def validate_columns(self, df: pd.DataFrame) -> list[str]:
        cleaned = self._clean_columns(df)
        return [feature for feature in self.features if feature not in cleaned.columns]

    def preprocess(self, df: pd.DataFrame) -> tuple[pd.DataFrame, np.ndarray]:
        if not self.features:
            raise RuntimeError("feature_columns.json is missing or empty.")
        if self.scaler is None:
            raise RuntimeError("scaler.joblib is not available.")

        cleaned = self._clean_columns(df)
        missing = [feature for feature in self.features if feature not in cleaned.columns]
        if missing:
            preview = ", ".join(missing[:12])
            suffix = " ..." if len(missing) > 12 else ""
            raise ValueError(
                f"CSV is missing {len(missing)} required model features: {preview}{suffix}"
            )

        X = cleaned[self.features].copy()
        X = X.replace([np.inf, -np.inf], np.nan)

        # Convert every model feature to numeric and impute bad/missing values with
        # the training-set mean preserved inside StandardScaler. After scaling,
        # an imputed value therefore maps close to zero.
        training_means = np.asarray(getattr(self.scaler, "mean_", np.zeros(len(self.features))))
        for idx, column in enumerate(self.features):
            X[column] = pd.to_numeric(X[column], errors="coerce")
            X[column] = X[column].fillna(float(training_means[idx]))

        scaled = self.scaler.transform(X).astype(np.float32)
        return cleaned, scaled

    def _ordered_sequence_groups(self, df: pd.DataFrame, scaled: np.ndarray):
        working = df.copy()
        working["__row_id"] = np.arange(len(working))

        if "Timestamp" in working.columns:
            working["__timestamp"] = pd.to_datetime(working["Timestamp"], errors="coerce")
        else:
            working["__timestamp"] = pd.NaT

        if "SourceCSV" in working.columns:
            grouped = working.groupby("SourceCSV", sort=False)
        else:
            grouped = [("uploaded_order", working)]

        groups = []
        for name, group in grouped:
            if group["__timestamp"].notna().any():
                group = group.sort_values(["__timestamp", "__row_id"], kind="stable")
            else:
                group = group.sort_values("__row_id", kind="stable")
            indices = group["__row_id"].to_numpy(dtype=int)
            groups.append((str(name), indices, scaled[indices]))
        return groups

    def predict(self, df: pd.DataFrame) -> dict[str, Any]:
        if not self.ready:
            raise RuntimeError("Core deployment artifacts are not available.")
        if len(df) == 0:
            raise ValueError("Uploaded CSV contains no rows.")

        cleaned, scaled = self.preprocess(df)

        # Logistic Regression - per flow.
        lr_prob = self.logistic.predict_proba(scaled)[:, 1]
        lr_pred = (lr_prob >= 0.5).astype(np.int32)

        # Autoencoder - per flow, when TensorFlow model is available.
        ae_error = None
        ae_pred = None
        if self.autoencoder is not None:
            reconstruction = self.autoencoder.predict(scaled, batch_size=512, verbose=0)
            ae_error = np.mean(np.square(scaled - reconstruction), axis=1)
            ae_pred = (ae_error > self.autoencoder_threshold).astype(np.int32)

        # LSTM - prediction applies to the final row of each sequence window.
        lstm_predictions: list[dict[str, Any]] = []
        lstm_probs: list[float] = []
        if self.lstm is not None and len(cleaned) >= self.sequence_length:
            for source, row_indices, group_scaled in self._ordered_sequence_groups(cleaned, scaled):
                if len(group_scaled) < self.sequence_length:
                    continue
                sequences = np.asarray(
                    [
                        group_scaled[i : i + self.sequence_length]
                        for i in range(len(group_scaled) - self.sequence_length + 1)
                    ],
                    dtype=np.float32,
                )
                probs = self.lstm.predict(sequences, batch_size=512, verbose=0).reshape(-1)
                for offset, probability in enumerate(probs):
                    target_pos = offset + self.sequence_length - 1
                    row_index = int(row_indices[target_pos])
                    probability = float(probability)
                    lstm_probs.append(probability)
                    lstm_predictions.append(
                        {
                            "row": row_index,
                            "source": source,
                            "prediction": "DDoS" if probability >= 0.5 else "BENIGN",
                            "attack_probability": probability,
                        }
                    )

        # Consensus is intentionally descriptive, not a separately trained model.
        per_row_samples = []
        for i in range(min(50, len(cleaned))):
            item = {
                "row": int(i),
                "logistic_prediction": "DDoS" if int(lr_pred[i]) else "BENIGN",
                "logistic_probability": float(lr_prob[i]),
            }
            if ae_error is not None:
                item.update(
                    {
                        "autoencoder_prediction": "DDoS" if int(ae_pred[i]) else "BENIGN",
                        "reconstruction_error": float(ae_error[i]),
                    }
                )
            per_row_samples.append(item)

        models = {
            "logistic_regression": {
                "available": True,
                "evaluated_units": int(len(lr_pred)),
                "attack_count": int(lr_pred.sum()),
                "benign_count": int((lr_pred == 0).sum()),
                "attack_rate": float(lr_pred.mean()),
                "average_attack_probability": float(np.mean(lr_prob)),
            },
            "autoencoder": {
                "available": ae_error is not None,
                "threshold": self.autoencoder_threshold,
            },
            "lstm": {
                "available": self.lstm is not None,
                "sequence_length": self.sequence_length,
                "evaluated_sequences": int(len(lstm_predictions)),
                "sequence_ordering": (
                    "SourceCSV + Timestamp" if "SourceCSV" in cleaned.columns and "Timestamp" in cleaned.columns
                    else "uploaded row order"
                ),
            },
        }

        if ae_error is not None:
            models["autoencoder"].update(
                {
                    "evaluated_units": int(len(ae_pred)),
                    "attack_count": int(ae_pred.sum()),
                    "benign_count": int((ae_pred == 0).sum()),
                    "attack_rate": float(ae_pred.mean()),
                    "average_reconstruction_error": float(np.mean(ae_error)),
                    "max_reconstruction_error": float(np.max(ae_error)),
                }
            )

        if lstm_probs:
            lstm_array = np.asarray(lstm_probs)
            models["lstm"].update(
                {
                    "attack_count": int((lstm_array >= 0.5).sum()),
                    "benign_count": int((lstm_array < 0.5).sum()),
                    "attack_rate": float(np.mean(lstm_array >= 0.5)),
                    "average_attack_probability": float(np.mean(lstm_array)),
                }
            )

        primary_model = "LSTM" if lstm_probs else "Logistic Regression"
        primary_attack_rate = float(lr_pred.mean())
        primary_attack_count = int(lr_pred.sum())
        primary_benign_count = int((lr_pred == 0).sum())
        primary_units = int(len(lr_pred))
        if lstm_probs:
            lstm_array = np.asarray(lstm_probs)
            primary_attack_rate = float(np.mean(lstm_array >= 0.5))
            primary_attack_count = int((lstm_array >= 0.5).sum())
            primary_benign_count = int((lstm_array < 0.5).sum())
            primary_units = int(len(lstm_array))

        # CSV-specific analytics used by the live dashboard. These values are
        # recomputed for every upload and are intentionally separate from the
        # fixed held-out-test metrics stored in results/final_metrics.json.
        model_attack_rates = []
        for label, key in [
            ("Logistic Regression", "logistic_regression"),
            ("LSTM", "lstm"),
            ("Autoencoder", "autoencoder"),
        ]:
            model_info = models.get(key, {})
            if model_info.get("available") and model_info.get("attack_rate") is not None:
                model_attack_rates.append(
                    {
                        "model": label,
                        "attack_rate": float(model_info["attack_rate"]),
                        "attack_count": int(model_info.get("attack_count", 0)),
                        "benign_count": int(model_info.get("benign_count", 0)),
                        "evaluated_units": int(
                            model_info.get("evaluated_units", model_info.get("evaluated_sequences", 0))
                        ),
                    }
                )

        agreement = None
        anomaly_histogram = []
        if ae_error is not None:
            both_benign = int(np.sum((lr_pred == 0) & (ae_pred == 0)))
            both_attack = int(np.sum((lr_pred == 1) & (ae_pred == 1)))
            disagree = int(np.sum(lr_pred != ae_pred))
            agreement = {
                "compared_rows": int(len(lr_pred)),
                "both_benign": both_benign,
                "both_attack": both_attack,
                "disagree": disagree,
                "agreement_rate": float((both_benign + both_attack) / max(1, len(lr_pred))),
            }

            # A compact histogram represents the full uploaded file without
            # returning every reconstruction error to the browser.
            bin_count = min(16, max(6, int(np.sqrt(len(ae_error)))))
            counts, edges = np.histogram(ae_error, bins=bin_count)
            for idx, count in enumerate(counts):
                start = float(edges[idx])
                end = float(edges[idx + 1])
                anomaly_histogram.append(
                    {
                        "start": start,
                        "end": end,
                        "mid": float((start + end) / 2.0),
                        "count": int(count),
                        "above_threshold": bool((start + end) / 2.0 > self.autoencoder_threshold),
                    }
                )

        lstm_trend = []
        if lstm_predictions:
            # Cap chart points so very large uploads stay responsive while
            # preserving coverage across the full sequence prediction range.
            max_points = 80
            if len(lstm_predictions) <= max_points:
                trend_indices = np.arange(len(lstm_predictions))
            else:
                trend_indices = np.linspace(0, len(lstm_predictions) - 1, max_points, dtype=int)
            for chart_index, pred_index in enumerate(trend_indices):
                pred = lstm_predictions[int(pred_index)]
                lstm_trend.append(
                    {
                        "point": int(chart_index + 1),
                        "sequence_index": int(pred_index),
                        "row": int(pred["row"]),
                        "attack_probability": float(pred["attack_probability"]),
                    }
                )

        return {
            "rows": int(len(cleaned)),
            "feature_count": len(self.features),
            "primary_model": primary_model,
            "primary_attack_rate": primary_attack_rate,
            "models": models,
            "live_analytics": {
                "primary_distribution": {
                    "model": primary_model,
                    "evaluated_units": primary_units,
                    "attack_count": primary_attack_count,
                    "benign_count": primary_benign_count,
                    "attack_rate": primary_attack_rate,
                },
                "model_attack_rates": model_attack_rates,
                "logistic_autoencoder_agreement": agreement,
                "autoencoder_histogram": anomaly_histogram,
                "lstm_probability_trend": lstm_trend,
            },
            "sample_flow_predictions": per_row_samples,
            "sample_lstm_predictions": lstm_predictions[:50],
        }
