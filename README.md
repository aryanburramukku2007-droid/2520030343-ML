# 2520030343-ML
# 🛡️ SentinelFlow
## DDoS Attack Detection Using LSTM and Autoencoder-Based Anomaly Detection

<p align="center">
  <b>An End-to-End Machine Learning Cybersecurity System for Intelligent DDoS Attack Detection</b>
</p>

<p align="center">
  Machine Learning • Deep Learning • Network Security • LSTM • Autoencoder • Flask • React
</p>

---

## 📌 Project Overview

**SentinelFlow** is an end-to-end Machine Learning cybersecurity project developed to detect **Distributed Denial-of-Service (DDoS) attacks** from network traffic.

The system is built using the **CICDDoS2019 dataset** and combines three complementary Machine Learning approaches:

- **Logistic Regression** for supervised per-flow classification
- **Long Short-Term Memory (LSTM)** for temporal sequence-based attack detection
- **Autoencoder** for unsupervised anomaly detection

The trained models are integrated with a **Flask REST API backend** and a modern **React + Vite frontend**, allowing users to upload network-flow CSV files and analyze them through the **SentinelFlow cybersecurity dashboard**.

The project covers the complete Machine Learning lifecycle:

```text
Dataset
   ↓
Data Cleaning
   ↓
Exploratory Data Analysis
   ↓
Feature Preparation
   ↓
Train / Validation / Test Split
   ↓
Feature Scaling
   ↓
Model Training
   ↓
Model Evaluation
   ↓
Model Serialization
   ↓
Flask Backend
   ↓
React Frontend
   ↓
Live CSV-Based DDoS Detection
```

---

# 🎯 Problem Statement

Distributed Denial-of-Service attacks attempt to overwhelm servers, applications, or network infrastructure by generating large amounts of malicious traffic.

Traditional detection methods may struggle when attack patterns change or when malicious behaviour becomes visible only across multiple network flows.

SentinelFlow addresses this by combining:

| Model | Detection Strategy |
|---|---|
| Logistic Regression | Detects DDoS attacks from individual network flows |
| LSTM | Detects temporal attack patterns across sequences of flows |
| Autoencoder | Detects unusual traffic by measuring deviation from normal BENIGN behaviour |

This hybrid approach provides both **supervised classification** and **unsupervised anomaly detection** capabilities.

---

# 🎯 Project Objectives

The main objectives of SentinelFlow are:

1. Preprocess and clean the CICDDoS2019 network traffic dataset.
2. Perform Exploratory Data Analysis to understand network-flow behaviour.
3. Build a supervised Logistic Regression baseline.
4. Build an LSTM model capable of learning temporal network patterns.
5. Build an Autoencoder trained only on BENIGN traffic for anomaly detection.
6. Compare all models using standard classification metrics.
7. Save trained models for deployment.
8. Develop a Flask REST API for inference.
9. Build an interactive React cybersecurity dashboard.
10. Allow users to upload network-flow CSV files for live DDoS analysis.

---

# 📊 Dataset

## CICDDoS2019

The project uses the **CICDDoS2019 dataset**, which contains BENIGN network traffic along with multiple DDoS attack categories.

Attack types represented in the project include:

```text
BENIGN
LDAP
MSSQL
NetBIOS
Portmap
Syn
UDP
UDPLag
```

---

## Final Clean Dataset

After preprocessing and cleaning:

| Property | Value |
|---|---:|
| Total Rows | 66,550 |
| BENIGN Rows | 33,275 |
| DDoS Rows | 33,275 |
| Numerical Model Features | 68 |
| Final Model-Ready Columns | 71 |

The final 71-column model-ready dataset contains:

```text
68 Numerical Features
+
BinaryLabel
+
Label
+
Split
```

---

## Target Variable

The primary target used for supervised learning is:

```text
BinaryLabel
```

Encoding:

```text
0 → BENIGN
1 → DDoS
```

The original attack category is retained in:

```text
Label
```

The dataset partition is retained in:

```text
Split
```

---

# 🧹 Data Preprocessing

The preprocessing pipeline includes:

- Removing invalid records
- Removing duplicate rows
- Handling NaN values
- Handling infinite values
- Separating model features and targets
- Removing identifier and leakage-related columns
- Creating train, validation, and test partitions
- Applying StandardScaler
- Preparing temporal data for the LSTM model

Columns such as the following are excluded from direct model input:

```text
Flow ID
Source IP
Destination IP
Timestamp
SourceCSV
```

Timestamp and SourceCSV are retained only where required for temporal LSTM sequence construction.

---

# 📦 Dataset Split

The final data split is:

| Split | Rows |
|---|---:|
| Training | 42,782 |
| Validation | 9,508 |
| Testing | 14,260 |

The **StandardScaler is fitted only on the training set**.

The same fitted scaler is then used for:

```text
Training
Validation
Testing
Deployment
```

This helps prevent data leakage.

---

# 🔍 Exploratory Data Analysis

Exploratory Data Analysis was performed before model training.

The project includes visualizations for:

- Binary class distribution
- Attack-type distribution
- Dataset split distribution
- Feature histograms
- Feature boxplots
- Feature correlations
- Correlation heatmap

EDA output files are available inside:

```text
PROJECT/results/eda/
```

---

# 🧠 Machine Learning Models

SentinelFlow uses three different models.

---

# 1️⃣ Logistic Regression

Logistic Regression is used as the supervised baseline model.

It evaluates individual network flows.

The model calculates a linear score:

```text
z = w · x + b
```

and converts it into a probability using the sigmoid function:

```text
σ(z) = 1 / (1 + e^(-z))
```

The prediction is then classified as:

```text
BENIGN
or
DDoS
```

---

## Logistic Regression Results

| Metric | Result |
|---|---:|
| Accuracy | 99.7826% |
| Precision | 99.8876% |
| Recall | 99.6774% |
| F1-Score | 99.7824% |
| ROC-AUC | 99.9270% |
| PR-AUC | 99.9489% |

Saved model:

```text
backend/saved_models/logistic_regression.joblib
```

---

# 2️⃣ Long Short-Term Memory — LSTM

LSTM stands for:

**Long Short-Term Memory**

It is a type of Recurrent Neural Network designed to learn patterns from sequential data.

Instead of analyzing only one flow, the LSTM model analyzes a sequence of:

```text
8 consecutive network flows
```

Each flow contains:

```text
68 numerical features
```

Therefore, the LSTM input shape is:

```text
(8, 68)
```

---

## LSTM Sequence Construction

For temporal sequence creation:

1. Network records are grouped using `SourceCSV`.
2. Records are sorted using `Timestamp`.
3. Sequences are created within the predefined dataset split.
4. Each sequence contains 8 flows.
5. The label of the final flow is used as the sequence target.

Sequence dimensions:

```text
Training:
(42733, 8, 68)

Validation:
(9459, 8, 68)

Testing:
(14211, 8, 68)
```

---

## LSTM Architecture

```text
Input
(8 × 68)
   │
   ▼
LSTM
64 Units
return_sequences=True
   │
   ▼
Dropout
0.30
   │
   ▼
LSTM
32 Units
   │
   ▼
Dropout
0.20
   │
   ▼
Dense
16 Units
ReLU
   │
   ▼
Dense
1 Unit
Sigmoid
   │
   ▼
DDoS Probability
```

Total trainable parameters:

```text
47,009
```

---

## LSTM Training Configuration

```text
Optimizer:
Adam

Loss Function:
Binary Cross-Entropy

Batch Size:
256

Maximum Epochs:
15
```

Training also uses:

```text
EarlyStopping
ModelCheckpoint
```

EarlyStopping prevents unnecessary training when validation performance stops improving.

ModelCheckpoint preserves the best model weights based on validation performance.

---

## LSTM Results

| Metric | Result |
|---|---:|
| Accuracy | 99.8593% |
| Precision | 99.9294% |
| Recall | 99.7886% |
| F1-Score | 99.8590% |
| ROC-AUC | 99.9902% |
| PR-AUC | 99.9916% |

Saved models:

```text
backend/saved_models/lstm_model.keras

backend/saved_models/lstm_model_final.keras
```

---

# 3️⃣ Autoencoder

The Autoencoder is used for **unsupervised anomaly detection**.

Unlike Logistic Regression and LSTM, the Autoencoder is trained only using:

```text
BENIGN training traffic
```

Its objective is to learn how normal network traffic behaves.

The Autoencoder attempts to reconstruct its input.

---

## Autoencoder Concept

```text
Normal Traffic
     ↓
Autoencoder
     ↓
Low Reconstruction Error
     ↓
Likely BENIGN
```

For unusual traffic:

```text
Abnormal Traffic
      ↓
Autoencoder
      ↓
High Reconstruction Error
      ↓
Possible DDoS / Anomaly
```

---

## Autoencoder Architecture

```text
Input
68 Features
     │
     ▼
Dense
48
     │
     ▼
Dense
24
     │
     ▼
Latent Layer
12
     │
     ▼
Dense
24
     │
     ▼
Dense
48
     │
     ▼
Output
68 Features
```

The central 12-dimensional layer acts as the:

```text
Latent Representation
```

---

## Reconstruction Error

The reconstruction error is calculated using Mean Squared Error:

```text
MSE = (1 / n) Σ(xᵢ - x̂ᵢ)²
```

where:

```text
x  = original input

x̂ = reconstructed input
```

---

## Autoencoder Decision Threshold

Final anomaly threshold:

```text
0.126525490859982
```

Prediction rule:

```text
Reconstruction Error ≤ Threshold
→ BENIGN

Reconstruction Error > Threshold
→ Anomaly / DDoS-like Traffic
```

The threshold is selected using validation data.

---

## Autoencoder Results

| Metric | Result |
|---|---:|
| Accuracy | 90.1262% |
| Precision | 83.7303% |
| Recall | 99.6073% |
| F1-Score | 90.9813% |
| ROC-AUC | 91.4257% |
| PR-AUC | 86.0693% |

Confusion Matrix:

```text
True Negatives  = 5750
False Positives = 1380
False Negatives = 28
True Positives  = 7102
```

The Autoencoder achieves very high Recall, meaning it successfully detects most DDoS attacks, while generating more false positives than the supervised models.

Saved models:

```text
backend/saved_models/autoencoder_model.keras

backend/saved_models/autoencoder_model_final.keras
```

---

# 📈 Final Model Comparison

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
|---|---:|---:|---:|---:|---:|---:|
| Logistic Regression | 99.7826% | 99.8876% | 99.6774% | 99.7824% | 99.9270% | 99.9489% |
| LSTM | 99.8593% | 99.9294% | 99.7886% | 99.8590% | 99.9902% | 99.9916% |
| Autoencoder | 90.1262% | 83.7303% | 99.6073% | 90.9813% | 91.4257% | 86.0693% |

> **Important:** Logistic Regression evaluates individual network flows, while the LSTM evaluates sequences containing 8 flows. Therefore, their evaluation units are not exactly identical.

---

# 📐 Evaluation Metrics

The project evaluates the models using:

```text
Accuracy
Precision
Recall
F1-Score
ROC-AUC
PR-AUC
Confusion Matrix
```

## Accuracy

```text
Accuracy =
(TP + TN)
───────────────
TP + TN + FP + FN
```

## Precision

```text
Precision =
TP
───────
TP + FP
```

## Recall

```text
Recall =
TP
───────
TP + FN
```

## F1-Score

```text
F1 =
2 × Precision × Recall
──────────────────────
Precision + Recall
```

For cybersecurity applications, **Recall is particularly important** because it represents the percentage of real attacks successfully detected by the system.

---

# 🖥️ SentinelFlow Web Application

The trained Machine Learning models are integrated into a complete web application called:

## SentinelFlow

The application architecture is:

```text
React / Vite Frontend
        ↓
Flask REST API
        ↓
Saved StandardScaler
        ↓
Logistic Regression
        +
LSTM
        +
Autoencoder
        ↓
Prediction Analytics
```

---

# 🌐 Frontend

Frontend technologies:

```text
React
Vite
JavaScript
CSS
HTML
```

Location:

```text
PROJECT/frontend/
```

Important files:

```text
frontend/
├── index.html
├── package.json
├── src/
│   ├── main.jsx
│   └── style.css
│
└── public/
    ├── sample_network_flows.csv
    └── graphs/
```

The dashboard provides:

- CSV upload
- Network-flow validation
- BENIGN vs DDoS prediction
- Suspicious traffic percentage
- Logistic Regression results
- LSTM probability analysis
- Autoencoder reconstruction-error analysis
- Model agreement analysis
- Risk indicators
- Research metrics
- Model comparison graphs
- EDA visualizations

---

# ⚙️ Backend

Backend technologies:

```text
Python
Flask
Flask-CORS
TensorFlow
Keras
Scikit-learn
Pandas
NumPy
Joblib
```

Location:

```text
PROJECT/backend/
```

Main files:

```text
backend/
├── app.py
├── model_service.py
├── requirements.txt
├── results/
└── saved_models/
```

---

# 🔌 REST API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Verify backend and model availability |
| GET | `/api/metrics` | Retrieve stored experiment metrics |
| GET | `/api/config` | Retrieve model configuration |
| POST | `/api/validate` | Validate uploaded CSV |
| POST | `/api/predict` | Perform DDoS detection |

---

# 🤖 Saved Model Artifacts

The trained deployment artifacts are stored inside:

```text
PROJECT/backend/saved_models/
```

Files include:

```text
logistic_regression.joblib

lstm_model.keras

lstm_model_final.keras

autoencoder_model.keras

autoencoder_model_final.keras

scaler.joblib

standard_scaler.joblib

feature_columns.json

model_config.json

autoencoder_threshold.json
```

The website performs **inference using already trained models**.

The models are not retrained whenever the application starts.

---

# 📂 Project Structure

```text
PROJECT/
│
├── backend/
│   │
│   ├── app.py
│   ├── model_service.py
│   ├── requirements.txt
│   │
│   ├── results/
│   │   └── metrics.json
│   │
│   └── saved_models/
│       ├── logistic_regression.joblib
│       ├── lstm_model.keras
│       ├── lstm_model_final.keras
│       ├── autoencoder_model.keras
│       ├── autoencoder_model_final.keras
│       ├── scaler.joblib
│       ├── standard_scaler.joblib
│       ├── feature_columns.json
│       ├── model_config.json
│       └── autoencoder_threshold.json
│
├── dataset/
│   │
│   ├── CICDDoS2019_66550_Clean.csv
│   ├── CICDDoS2019_66550_ModelReady.csv
│   ├── CICDDoS2019_Train_42782.csv
│   ├── CICDDoS2019_Validation_9508.csv
│   ├── CICDDoS2019_Test_14260.csv
│   ├── cleaning_report.json
│   └── README.txt
│
├── frontend/
│   │
│   ├── index.html
│   ├── package.json
│   │
│   ├── src/
│   │   ├── main.jsx
│   │   └── style.css
│   │
│   └── public/
│       ├── sample_network_flows.csv
│       └── graphs/
│
├── notebooks/
│   └── CICDDoS2019_DDoS_LSTM_Autoencoder.ipynb
│
├── results/
│   │
│   ├── eda/
│   ├── graphs/
│   ├── autoencoder_metrics.csv
│   ├── lstm_metrics.csv
│   ├── model_comparison.csv
│   ├── final_metrics.json
│   └── README.md
│
├── report/
│   └── project_report_draft.md
│
├── DDoS_LSTM_Autoencoder_Presentation.pdf
├── SentinelFlow_DDoS_Final_Presentation_Review-3.pdf
├── Literature_Review_DDoS_LSTM_Autoencoder.csv
├── MACHINE LEARNING ABSTRACT.pdf
├── ML_DDoS_EDA_Logistic_Regression_ (1).ipynb
│
├── DYNAMIC_DASHBOARD_UPDATE.md
├── START_HERE.md
├── .gitignore
└── README.md
```

---

# 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Machine Learning | Scikit-learn |
| Deep Learning | TensorFlow, Keras |
| Data Processing | Pandas, NumPy |
| Backend | Flask, Python |
| Frontend | React, Vite, JavaScript |
| Model Serialization | Joblib, Keras |
| Dataset | CICDDoS2019 |
| Version Control | Git, GitHub |
| Development Environment | VS Code, Jupyter / Colab |

---

# 🚀 How to Run SentinelFlow

## Prerequisites

Install:

```text
Python 3.12
Node.js
npm
VS Code
```

For Windows, it is recommended to use a short project path such as:

```text
C:\ML\DDoS_LSTM_Autoencoder_Project
```

This helps avoid Windows long-path problems when installing TensorFlow.

---

# 1️⃣ Run the Backend

Open the project in VS Code.

Open a terminal and navigate to:

```powershell
cd backend
```

Create a Python virtual environment:

```powershell
py -3.12 -m venv .venv
```

Allow PowerShell activation for the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Upgrade pip:

```powershell
python -m pip install --upgrade pip
```

Install backend dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the Flask server:

```powershell
python app.py
```

The backend should run at:

```text
http://127.0.0.1:5000
```

---

# 2️⃣ Run the Frontend

Open another terminal.

Navigate to:

```powershell
cd frontend
```

Install Node dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Open the URL displayed by Vite.

Normally:

```text
http://localhost:5173
```

---

# 🧪 Testing the Application

A sample network traffic CSV file is provided inside:

```text
frontend/public/sample_network_flows.csv
```

Upload this file through the SentinelFlow dashboard to test the complete prediction pipeline.

---

# 🔄 Live Prediction Pipeline

```text
User Uploads CSV
        │
        ▼
CSV Validation
        │
        ▼
Feature Extraction
        │
        ▼
Missing Value Handling
        │
        ▼
Saved StandardScaler
        │
        ├─────────────────┐
        ▼                 ▼
Logistic Regression   Autoencoder
        │                 │
        └────────┬────────┘
                 │
                 ▼
          LSTM Sequences
                 │
                 ▼
       Prediction Aggregation
                 │
                 ▼
      Dynamic Risk Analytics
                 │
                 ▼
        SentinelFlow Dashboard
```

---

# 📊 Dynamic Analytics

When a user uploads a CSV, SentinelFlow can dynamically display:

```text
BENIGN Prediction Count

DDoS Prediction Count

Suspicious Traffic Percentage

Logistic Regression Attack Rate

LSTM Probability Trend

Autoencoder Reconstruction Error

Model Agreement

Risk Level

Per-Record Predictions

Per-Sequence Predictions
```

---

# 📊 Fixed Research Results

Some results shown in the dashboard come from the original held-out experiment and therefore remain fixed.

These include:

```text
Accuracy

Precision

Recall

F1-Score

ROC-AUC

PR-AUC

Original Confusion Matrices

Training Curves

ROC Curves

Precision-Recall Curves
```

These metrics are not recalculated for an unlabeled uploaded CSV because the true labels are unknown.

---

# 📈 Research Graphs

Experiment visualizations are available inside:

```text
results/graphs/
```

Examples include:

```text
LSTM Training Accuracy

LSTM Training Loss

LSTM Confusion Matrix

LSTM ROC Curve

LSTM Precision-Recall Curve

Autoencoder Training Loss

Autoencoder Reconstruction Error

Autoencoder Confusion Matrix

Autoencoder ROC Curve

Autoencoder Precision-Recall Curve

Logistic Regression Confusion Matrix

Logistic Regression ROC Curve

Final Model Comparison

Accuracy Comparison

Recall Comparison
```

---

# 📊 EDA Graphs

EDA graphs are available inside:

```text
results/eda/
```

Examples include:

```text
Binary Class Distribution

Attack Type Distribution

Dataset Split Distribution

Top Feature Correlations

Correlation Heatmap

Feature Histograms

Feature Boxplots
```

---

# 📚 Jupyter Notebook

The complete Machine Learning workflow is available inside:

```text
notebooks/CICDDoS2019_DDoS_LSTM_Autoencoder.ipynb
```

The notebook includes:

```text
Dataset Loading

Cleaning

Preprocessing

EDA

Feature Scaling

Logistic Regression

LSTM Sequence Creation

LSTM Training

Autoencoder Training

Evaluation

Model Comparison

Graph Generation

Model Saving
```

---

# 🔒 Data Leakage Prevention

Several precautions are taken to reduce data leakage.

The system does not directly use identifiers such as:

```text
Flow ID
Source IP
Destination IP
Raw Timestamp
SourceCSV
```

as model features.

The StandardScaler is fitted using only:

```text
Training Data
```

and then reused for:

```text
Validation
Testing
Deployment
```

---

# ⏱️ Important LSTM Methodology Note

The train, validation, and test partitions were created before temporal sequence ordering.

For LSTM preparation:

```text
Rows are grouped by SourceCSV

↓

Rows are sorted using Timestamp

↓

Sorting occurs inside the existing split

↓

8-flow sequences are generated
```

Therefore, this experiment should be described as:

> **Chronologically ordered sequence modelling within predefined train, validation, and test splits.**

It should not be described as a strict future-time holdout experiment.

---

# 🌟 Key Project Highlights

SentinelFlow demonstrates:

```text
✔ CICDDoS2019 Network Security Dataset

✔ Balanced BENIGN and DDoS Dataset

✔ 68 Numerical Network Features

✔ Leakage-Aware Preprocessing

✔ Logistic Regression Baseline

✔ Temporal LSTM Sequence Learning

✔ Autoencoder-Based Anomaly Detection

✔ Validation-Based Anomaly Threshold

✔ StandardScaler Train-Only Fitting

✔ Multiple Evaluation Metrics

✔ Model Serialization

✔ Flask REST API

✔ React + Vite Frontend

✔ CSV-Based Live Prediction

✔ Dynamic Cybersecurity Analytics

✔ EDA Visualizations

✔ Model Comparison Graphs

✔ Complete Machine Learning Notebook

✔ Research Report and Presentation Material
```

---

# 🛡️ Why SentinelFlow?

SentinelFlow combines three different perspectives of network traffic analysis:

```text
Logistic Regression
      ↓
What does this individual flow look like?

LSTM
      ↓
What pattern is occurring across consecutive flows?

Autoencoder
      ↓
How different is this traffic from normal BENIGN behaviour?
```

Combining these approaches creates a more complete academic demonstration of modern Machine Learning-based network intrusion detection.

---

# ⚠️ Disclaimer

SentinelFlow was developed for:

```text
Academic Research

Machine Learning Education

Cybersecurity Education

Defensive Network Analysis

DDoS Detection Experimentation
```

The project is intended strictly for **defensive and educational purposes**.

---

# 📌 Project Title

**DDoS Attack Detection Using LSTM and Autoencoder-Based Anomaly Detection**

---

# 💻 Application Name

**SentinelFlow**

---

# 🚀 Quick Start

For the shortest setup instructions, open:

```text
START_HERE.md
```

---

<p align="center">
  <b>SentinelFlow — Intelligent Machine Learning for Network Threat Detection</b>
</p>

<p align="center">
  Built for Academic Machine Learning & Cybersecurity Research
</p>
