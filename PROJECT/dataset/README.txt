CICDDoS2019 cleaned 66,550-row project dataset

Source: user-provided 70,000-row reduction of CICDDoS2019 CSV-03-11.
Cleaning: removed duplicate traffic records, balanced BENIGN/DDoS at 33,275 each, leakage-safe re-split, replaced NaN/Infinity with TRAIN-only medians, removed Unnamed: 0 and duplicate Fwd Header Length.1.
Splits: train 42,782; validation 9,508; test 14,260. Each split is binary-balanced.
ModelReady excludes identifiers/raw metadata, labels as features, and constant columns. BinaryLabel is the target.
For LSTM sequence construction, use the Clean file so Timestamp and SourceCSV remain available for ordering/grouping, but do not feed them directly as numeric features.
