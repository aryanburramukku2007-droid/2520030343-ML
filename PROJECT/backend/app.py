from __future__ import annotations

from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from model_service import DDoSModelService

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "saved_models"
PROJECT_RESULTS_DIR = BASE_DIR.parent / "results"

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024 * 1024  # 64 MB CSV upload cap

service = DDoSModelService(MODEL_DIR, PROJECT_RESULTS_DIR)


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok" if service.ready else "degraded",
            "project": "DDoS Attack Detection Using LSTM and Autoencoder-Based Anomaly Detection",
            **service.status(),
        }
    )


@app.get("/api/metrics")
def metrics():
    return jsonify(service.metrics)


@app.get("/api/config")
def config():
    return jsonify(
        {
            "feature_count": len(service.features),
            "sequence_length": service.sequence_length,
            "autoencoder_threshold": service.autoencoder_threshold,
            "required_features": service.features,
        }
    )


@app.post("/api/validate")
def validate():
    if "file" not in request.files:
        return jsonify({"error": "Upload a CSV file under form field name 'file'."}), 400
    try:
        df = pd.read_csv(request.files["file"], nrows=5, low_memory=False)
        missing = service.validate_columns(df)
        return jsonify(
            {
                "valid": len(missing) == 0,
                "required_feature_count": len(service.features),
                "missing_features": missing,
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/predict")
def predict():
    if "file" not in request.files:
        return jsonify({"error": "Upload a CSV file under form field name 'file'."}), 400

    uploaded = request.files["file"]
    if not uploaded.filename or not uploaded.filename.lower().endswith(".csv"):
        return jsonify({"error": "Please upload a .csv file."}), 400

    try:
        df = pd.read_csv(uploaded, low_memory=False)
        result = service.predict(df)
        result["filename"] = uploaded.filename
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "CSV is larger than the 64 MB upload limit."}), 413


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
