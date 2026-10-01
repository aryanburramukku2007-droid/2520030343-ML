# Start Here — Run the Finished Project in VS Code (Windows)

## 1. Extract the ZIP

Extract the complete project and open the root folder in VS Code.

You should see:

```text
dataset
notebooks
backend
frontend
results
report
README.md
```

## 2. Start the backend

Open **Terminal 1** in VS Code:

```powershell
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Wait for Flask to show a URL similar to:

```text
http://127.0.0.1:5000
```

Keep Terminal 1 running.

### Quick backend check

Open this in the browser:

```text
http://127.0.0.1:5000/api/health
```

You want the JSON to show the Logistic Regression, LSTM, Autoencoder, scaler, and 68 features available.

## 3. Start the frontend

Open **Terminal 2** in VS Code:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, normally:

```text
http://localhost:5173
```

## 4. Test a prediction

On the SentinelFlow dashboard:

1. Scroll to **Traffic Analyzer**.
2. Click **Choose CSV**.
3. Select `frontend/public/sample_network_flows.csv`.
4. Click **Run analysis**.
5. The page will show model-by-model attack rates and sample flow predictions.

## 5. If TensorFlow does not install

Check your Python version:

```powershell
python --version
```

Use Python 3.10, 3.11, or 3.12 for the smoothest TensorFlow setup. Then delete `backend/.venv` and repeat Step 2 with that Python installation.

## 6. If PowerShell blocks activation

Run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then:

```powershell
.\.venv\Scripts\Activate.ps1
```

## 7. What is already finished

- Cleaned 66,550-flow CICDDoS2019 dataset
- EDA and preprocessing
- Logistic Regression training/evaluation
- Temporal LSTM training/evaluation
- Autoencoder training/evaluation
- Validation-only Autoencoder threshold optimization
- Model comparison tables/graphs
- Saved deployment artifacts
- Flask API integration
- React/Vite cybersecurity dashboard

You do **not** need to retrain the models to run the website.
