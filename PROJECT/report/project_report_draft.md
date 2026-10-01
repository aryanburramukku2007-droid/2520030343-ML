# DDoS Attack Detection Using LSTM and Autoencoder-Based Anomaly Detection

## Abstract

This project develops an end-to-end Distributed Denial of Service (DDoS) traffic detection system using a cleaned subset of the CICDDoS2019 dataset. Three complementary approaches are evaluated: Logistic Regression as a supervised baseline, a Long Short-Term Memory (LSTM) model for ordered traffic-flow sequences, and an Autoencoder trained only on benign traffic for unsupervised anomaly detection. After duplicate removal and leakage-aware cleaning, the final balanced dataset contains 66,550 records with 68 numeric model features. Models are evaluated using Accuracy, Precision, Recall, F1-score, ROC-AUC, PR-AUC, confusion matrices, ROC curves and precision-recall curves. The temporal LSTM achieves 99.8593% accuracy and 99.9902% ROC-AUC on its sequence test set. The Autoencoder achieves 99.6073% attack recall after selecting its reconstruction-error threshold using validation data only. A Flask API and React dashboard integrate the trained artifacts for CSV-based traffic analysis.

## 1. Introduction

DDoS attacks attempt to exhaust a target service or network by generating malicious traffic at a scale that prevents legitimate users from receiving normal service. Flow-level network monitoring provides a practical way to characterize traffic using packet counts, packet sizes, flow duration, inter-arrival times, flags and rate-based statistics. Machine learning can use these flow features to distinguish ordinary traffic from attack behavior.

This project studies three different detection strategies on the same CICDDoS2019-derived data: a conventional supervised classifier, a recurrent model designed to exploit ordered flow context, and an anomaly detector that learns only benign behavior. The objective is not only to compare test metrics, but also to package the complete experiment into a usable software system.

## 2. Problem Statement

The objective is to detect whether network-flow traffic is **BENIGN** or **DDoS** and compare how supervised classification, temporal sequence modeling and unsupervised anomaly detection behave on the same project dataset. The system must also preserve a deployable preprocessing pipeline so that the trained models can be used by a web application.

## 3. Dataset

The project uses data sampled from the **CICDDoS2019 03-11 CSV archive**. Attack labels retained in the sample include LDAP, MSSQL, NetBIOS, Portmap, Syn, UDP and UDPLag, together with BENIGN traffic.

The first reduced dataset was capped at 70,000 rows. Duplicate-flow cleaning left 33,275 unique benign records. To maintain a balanced binary task, the attack class was also sampled to 33,275 records, producing the final dataset:

- Total records: **66,550**
- BENIGN: **33,275**
- DDoS: **33,275**
- Model features: **68**
- Training flows: **42,782**
- Validation flows: **9,508**
- Test flows: **14,260**

## 4. Data Cleaning and Preprocessing

The cleaning pipeline removes duplicate rows and redundant/index-style fields. Identifier and metadata fields such as Flow ID, IP addresses and raw source metadata are not used as ordinary numeric model inputs. Infinite values are converted to missing values and handled before scaling. The final model-ready representation contains 68 numeric features.

A `StandardScaler` is fitted on the training feature matrix only and reused for validation, test and deployment data. This prevents validation/test statistics from being used to determine scaling parameters. The fitted scaler and exact feature order are saved for the backend.

## 5. Exploratory Data Analysis

The notebook generates class-distribution plots, retained attack-type distribution, train/validation/test distribution, correlation analysis, feature histograms and boxplots. These plots are exported under `results/eda/`. The final project also stores model-specific confusion matrices, ROC curves, precision-recall curves and training curves under `results/graphs/`.

## 6. Methodology

### 6.1 Logistic Regression

Logistic Regression is used as the supervised baseline. It receives each scaled 68-feature flow independently and outputs a probability for the DDoS class. A threshold of 0.5 converts the probability into a binary prediction.

### 6.2 Temporal LSTM

The LSTM uses sequence length **8**. For each predefined split, rows are grouped by `SourceCSV`, sorted by `Timestamp`, and converted into overlapping windows without crossing source-file boundaries. Each input therefore has shape **8 × 68** and the target is the class of the final flow in the window.

The network contains two LSTM layers (64 and 32 units), Dropout layers, a 16-unit ReLU dense layer and a sigmoid output. Early stopping and validation-loss model checkpointing are used during training.

Important interpretation: because the train/validation/test split was created before temporal ordering, this is a **chronologically ordered within-split sequence experiment**, not a strict earlier-time training versus later-time testing design.

### 6.3 Autoencoder Anomaly Detection

The Autoencoder is trained only with BENIGN training flows, making it an unsupervised anomaly-detection component with respect to attack examples. It learns to reconstruct normal 68-feature traffic. At inference time, the mean squared reconstruction error is treated as an anomaly score.

The final anomaly threshold (**0.126525490859982**) is selected by maximizing F1 on the validation precision-recall curve. The test labels are not used to select this threshold.

## 7. Evaluation Metrics

The project reports:

- Accuracy
- Precision
- Recall
- F1-score
- ROC-AUC
- PR-AUC
- Confusion matrices

Recall is especially important in the security context because false negatives represent DDoS traffic that was not detected. Precision is also relevant because a low precision would create excessive false alarms.

## 8. Results

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---:|---:|---:|---:|---:|---:|
| Logistic Regression | 99.7826% | 99.8876% | 99.6774% | 99.7824% | 99.9270% | 99.9489% |
| Temporal LSTM | 99.8593% | 99.9294% | 99.7886% | 99.8590% | 99.9902% | 99.9916% |
| Autoencoder | 90.1262% | 83.7303% | 99.6073% | 90.9813% | 91.4257% | 86.0693% |

The Logistic Regression baseline is already highly effective on the balanced binary flow task. The temporal LSTM gives slightly stronger measured performance and obtains the highest ROC-AUC and PR-AUC values. The Autoencoder has lower overall accuracy and precision because it is solving a different problem: it is trained only to reconstruct benign traffic instead of learning directly from DDoS labels. After validation-based threshold optimization, it detects 7,102 of 7,130 DDoS test flows, corresponding to 99.6073% recall, while producing more benign false positives.

The final Autoencoder confusion matrix is:

```text
              Predicted
              BENIGN  DDoS
Actual BENIGN   5750  1380
Actual DDoS       28  7102
```

## 9. Deployment Architecture

The final software has two local services:

1. **Flask backend** — loads the saved StandardScaler, feature order, Logistic Regression model, LSTM model, Autoencoder model and anomaly threshold.
2. **React/Vite frontend** — accepts a network-flow CSV and visualizes the returned model outputs.

The backend rejects CSV files that do not contain the required 68 model features. Logistic Regression and Autoencoder operate per flow. LSTM builds 8-flow windows; when `SourceCSV` and `Timestamp` are present it orders flows chronologically within source groups, otherwise it uses uploaded row order.

## 10. Dashboard

The SentinelFlow dashboard provides:

- Backend/model readiness indicator
- CSV drag-and-drop upload
- Primary threat rate
- Logistic Regression summary
- LSTM sequence summary
- Autoencoder anomaly summary
- Per-flow sample predictions
- Real project evaluation metrics
- Exported experiment graphs
- Downloadable sample CSV for testing

## 11. Conclusion

The project demonstrates a complete DDoS-detection lifecycle from raw CICDDoS2019 sampling and cleaning through supervised learning, temporal deep learning, unsupervised anomaly detection, evaluation and deployment. Logistic Regression provides a strong classical baseline, while the LSTM produces the strongest measured classification results in the experiment. The Autoencoder provides a complementary behavior-based detection mechanism with very high attack recall even though it is trained only on benign traffic. The saved preprocessing and model artifacts allow the experimental results to be integrated into a functional web dashboard instead of remaining only inside a notebook.

## 12. Limitations and Future Work

The 66,550-row dataset is a balanced subset rather than the entire CICDDoS2019 corpus. Evaluation is based on one source day, and the LSTM is not tested using a strict future-day holdout. Future work can preserve day-level temporal separation, evaluate multiclass attack-type prediction, calibrate operating thresholds for realistic class imbalance, stream flow records in real time, and test generalization on additional network-security datasets.
