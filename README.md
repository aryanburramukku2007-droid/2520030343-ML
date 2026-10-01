# 🛡️ SentinelFlow — DDoS Attack Detection Using Machine Learning & Deep Learning

> **An end-to-end cybersecurity platform for detecting Distributed Denial of Service (DDoS) attacks using Logistic Regression, LSTM, and Autoencoder-based anomaly detection.**

---

## 📌 Overview

**SentinelFlow** is a machine-learning and cybersecurity project designed to detect **Distributed Denial of Service (DDoS) attacks from network-flow data**.

The project combines three different machine-learning approaches:

- **Logistic Regression** — supervised baseline classification
- **LSTM** — temporal sequence-based deep learning
- **Autoencoder** — unsupervised anomaly detection

The trained models are integrated into a **Flask REST API** and connected to a **React + Vite security dashboard**.

Users can upload a compatible network-flow CSV file and receive predictions, attack probabilities, anomaly information, and visual analytics through the dashboard.

---

# 🎯 Objectives

The main objectives of SentinelFlow are to:

- Detect DDoS attacks from network-flow data.
- Compare classical machine learning and deep learning approaches.
- Identify temporal patterns using LSTM networks.
- Detect abnormal traffic using Autoencoder reconstruction error.
- Perform exploratory data analysis on DDoS network traffic.
- Build a reproducible preprocessing and modeling pipeline.
- Deploy trained models through a Flask backend.
- Build an interactive React-based cybersecurity dashboard.
- Provide CSV-based network traffic analysis.
- Compare the performance of different detection approaches.

---

# 🧠 Machine Learning Models

SentinelFlow uses three complementary approaches.

## 1. Logistic Regression

Logistic Regression acts as the supervised baseline model.

Each network flow is classified independently as:

```text
BENIGN
DDoS
