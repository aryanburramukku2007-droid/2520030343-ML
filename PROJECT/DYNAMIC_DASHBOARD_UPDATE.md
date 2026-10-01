# SentinelFlow Dynamic CSV Analytics Update

This version keeps the trained models and fixed research metrics unchanged, but upgrades the presentation website so live graphs are recomputed for every uploaded CSV.

## What changed

- Removed visible `66K / 66,550` dataset-size callouts from the website UI.
- Added a Project Capabilities section.
- Added CSV-specific live charts after every successful upload:
  - Primary BENIGN vs DDoS traffic classification.
  - Model attack-rate comparison.
  - Logistic Regression + Autoencoder agreement.
  - Autoencoder reconstruction-error histogram.
  - LSTM sequence attack-probability trend.
- Clearly separated **Live CSV Analytics** from **Fixed Research Performance**.
- Kept original held-out-test Accuracy / Precision / Recall / F1 / ROC-AUC evidence fixed, which is scientifically correct for unlabeled uploads.
- Removed the problematic unused `Github` lucide-react import.
- Keras models now load with `compile=False` for safer inference-only deployment.

## Files changed

- `backend/model_service.py`
- `frontend/src/main.jsx`
- `frontend/src/style.css`

## Run after updating

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

### Frontend (second terminal)

```powershell
cd frontend
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Upload `frontend/public/sample_network_flows.csv` and click **Run analysis**.

The dynamic graphs only appear after a successful CSV analysis. Uploading another compatible CSV and running analysis rebuilds the graphs from that file's predictions.
