# DDoS Attack Detection Using LSTM and Autoencoder-Based Anomaly Detection

A complete end-to-end ML project using a cleaned subset of **CICDDoS2019 (03-11)**. The project includes the dataset, Colab notebook, trained model artifacts, evaluation results, Flask inference API, and a React/Vite cybersecurity dashboard.

## Final experiment

- Final clean dataset: **66,550 flows**
- BENIGN: **33,275**
- DDoS: **33,275**
- Model input features: **68**
- Train / validation / test: **42,782 / 9,508 / 14,260 flows**
- LSTM sequence length: **8 flows**
- Autoencoder threshold: **0.126525490859982**, selected on validation data only

### Final measured test results

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---:|---:|---:|---:|---:|---:|
| Logistic Regression | 99.7826% | 99.8876% | 99.6774% | 99.7824% | 99.9270% | 99.9489% |
| Temporal LSTM | 99.8593% | 99.9294% | 99.7886% | 99.8590% | 99.9902% | 99.9916% |
| Autoencoder | 90.1262% | 83.7303% | 99.6073% | 90.9813% | 91.4257% | 86.0693% |

> Logistic Regression evaluates individual flows. LSTM evaluates 8-flow ordered sequences, so their test units are not identical. The Autoencoder is an unsupervised anomaly detector trained only on benign training traffic.

## Project structure

```text
DDoS_LSTM_Autoencoder_Project/
├── dataset/                  # clean, model-ready, train/val/test CSVs
├── notebooks/                # complete Colab notebook
├── backend/                  # Flask API + trained model artifacts
│   └── saved_models/
├── frontend/                 # SentinelFlow React/Vite dashboard
│   └── public/graphs/        # real exported experiment plots
├── results/                  # final metrics, EDA, evaluation graphs
├── report/                   # report draft with measured results
├── START_HERE.md             # exact local run instructions
└── README.md
```

## Run locally

Read **`START_HERE.md`** for the shortest Windows/VS Code workflow.

### Backend

Use Python **3.10–3.12**. From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Backend: `http://127.0.0.1:5000`

Useful endpoints:

- `GET /api/health`
- `GET /api/metrics`
- `GET /api/config`
- `POST /api/validate` with form field `file`
- `POST /api/predict` with form field `file`

### Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

The frontend uses `http://localhost:5000` by default. To change it, create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## Test the website

The frontend contains:

```text
frontend/public/sample_network_flows.csv
```

Upload that file in the dashboard to test the complete prediction flow.

## Deployment behavior

- Logistic Regression predicts every uploaded flow.
- Autoencoder computes reconstruction error for every flow and compares it with the saved validation-selected threshold.
- LSTM uses 8-flow windows. If `SourceCSV` and `Timestamp` are included, the backend orders flows within each source file chronologically. Otherwise it uses uploaded row order.
- Missing/invalid numeric values are imputed to the training mean preserved in the fitted `StandardScaler`.
- A CSV missing any of the required 68 model features is rejected rather than silently creating invalid features.

## Saved deployment artifacts

`backend/saved_models/` includes:

- `logistic_regression.joblib`
- `lstm_model.keras`
- `lstm_model_final.keras`
- `autoencoder_model.keras`
- `autoencoder_model_final.keras`
- `scaler.joblib`
- `feature_columns.json`
- `model_config.json`
- `autoencoder_threshold.json`

## Important methodology note

The original train/validation/test split was created before temporal ordering. For the LSTM, rows are then grouped by `SourceCSV`, ordered by `Timestamp` inside each existing split, and converted into 8-flow windows. Therefore this is a **chronologically ordered within-split sequence experiment**, not a strict future-time holdout experiment.
