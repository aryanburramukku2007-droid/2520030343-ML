import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  FileSearch,
  Layers3,
  Network,
  ScanSearch,
  Shield,
  ShieldCheck,
  Upload,
  Waves,
  XCircle,
  Zap,
} from 'lucide-react';
import './style.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FALLBACK_METRICS = {
  'Logistic Regression': {
    accuracy: 0.9978260869565218,
    precision: 0.9988756148981026,
    recall: 0.9967741935483871,
    f1: 0.9978237978237978,
    roc_auc: 0.9992696446872252,
    pr_auc: 0.999488871896474,
  },
  LSTM: {
    accuracy: 0.998593,
    precision: 0.999294,
    recall: 0.997886,
    f1: 0.99859,
    roc_auc: 0.999902,
    pr_auc: 0.999916,
  },
  Autoencoder: {
    accuracy: 0.901262,
    precision: 0.837303,
    recall: 0.996073,
    f1: 0.909813,
    roc_auc: 0.914257,
    pr_auc: 0.860693,
  },
};

const pct = (value, digits = 2) => `${((Number(value) || 0) * 100).toFixed(digits)}%`;
const num = (value) => Number(value || 0).toLocaleString();

function ModelMetricCard({ name, metrics, icon: Icon, note }) {
  return (
    <article className="model-card">
      <div className="model-card-top">
        <div className="icon-box"><Icon size={20} /></div>
        <div>
          <span className="eyebrow">HELD-OUT TEST MODEL</span>
          <h3>{name}</h3>
        </div>
      </div>
      <div className="metric-grid compact">
        <div><span>Accuracy</span><strong>{pct(metrics.accuracy)}</strong></div>
        <div><span>Recall</span><strong>{pct(metrics.recall)}</strong></div>
        <div><span>F1 score</span><strong>{pct(metrics.f1)}</strong></div>
        <div><span>ROC-AUC</span><strong>{pct(metrics.roc_auc)}</strong></div>
      </div>
      <p className="muted small">{note}</p>
    </article>
  );
}

function ThreatMeter({ rate }) {
  const percentage = Math.max(0, Math.min(100, Math.round((rate || 0) * 100)));
  const level = percentage >= 60 ? 'Critical' : percentage >= 25 ? 'Elevated' : 'Low';
  return (
    <div className="threat-meter">
      <div className="ring" style={{ '--value': `${percentage * 3.6}deg` }}>
        <div className="ring-inner">
          <strong>{percentage}%</strong>
          <span>attack rate</span>
        </div>
      </div>
      <div>
        <span className="eyebrow">PRIMARY ASSESSMENT</span>
        <h3>{level} threat</h3>
        <p className="muted">Calculated again for the current uploaded CSV.</p>
      </div>
    </div>
  );
}

function TrafficDistributionChart({ data }) {
  if (!data) return null;
  const total = Math.max(1, Number(data.evaluated_units || 0));
  const attackPct = Math.max(0, Math.min(100, (Number(data.attack_count || 0) / total) * 100));
  return (
    <article className="live-chart-card">
      <div className="chart-card-head">
        <div><span className="eyebrow">LIVE CSV</span><h3>Traffic classification</h3></div>
        <span className="chart-badge">{data.model}</span>
      </div>
      <div className="donut-layout">
        <div className="donut" style={{ '--attack': `${attackPct * 3.6}deg` }}>
          <div><strong>{attackPct.toFixed(1)}%</strong><span>DDoS</span></div>
        </div>
        <div className="legend-stack">
          <div><i className="legend-dot attack-dot" /><span>DDoS / attack</span><strong>{num(data.attack_count)}</strong></div>
          <div><i className="legend-dot benign-dot" /><span>BENIGN</span><strong>{num(data.benign_count)}</strong></div>
          <div className="legend-total"><span>Evaluated units</span><strong>{num(data.evaluated_units)}</strong></div>
        </div>
      </div>
      <p className="chart-note">This chart is regenerated from the current CSV every time you run analysis.</p>
    </article>
  );
}

function ModelAttackRateChart({ rows = [] }) {
  if (!rows.length) return null;
  return (
    <article className="live-chart-card">
      <div className="chart-card-head">
        <div><span className="eyebrow">LIVE CSV</span><h3>Model attack-rate comparison</h3></div>
        <BarChart3 size={19} />
      </div>
      <div className="horizontal-bars">
        {rows.map((row) => (
          <div className="hbar-row" key={row.model}>
            <div className="hbar-label"><span>{row.model}</span><strong>{pct(row.attack_rate, 1)}</strong></div>
            <div className="hbar-track"><i style={{ width: `${Math.max(1, Math.min(100, Number(row.attack_rate || 0) * 100))}%` }} /></div>
            <small>{num(row.attack_count)} flagged • {num(row.evaluated_units)} evaluated</small>
          </div>
        ))}
      </div>
      <p className="chart-note">Different models can flag different proportions because they use different detection strategies.</p>
    </article>
  );
}

function AgreementChart({ agreement }) {
  if (!agreement) return null;
  const total = Math.max(1, agreement.compared_rows || 0);
  const benign = (agreement.both_benign / total) * 100;
  const attack = (agreement.both_attack / total) * 100;
  const disagree = (agreement.disagree / total) * 100;
  return (
    <article className="live-chart-card">
      <div className="chart-card-head">
        <div><span className="eyebrow">LIVE CSV</span><h3>LR + Autoencoder agreement</h3></div>
        <span className="chart-badge">{pct(agreement.agreement_rate, 1)} agree</span>
      </div>
      <div className="agreement-bar" aria-label="Model agreement stacked bar">
        <i className="agree-benign" style={{ width: `${benign}%` }} title="Both benign" />
        <i className="agree-attack" style={{ width: `${attack}%` }} title="Both attack" />
        <i className="agree-disagree" style={{ width: `${disagree}%` }} title="Disagree" />
      </div>
      <div className="agreement-legend">
        <div><i className="legend-dot benign-dot" /><span>Both BENIGN</span><strong>{num(agreement.both_benign)}</strong></div>
        <div><i className="legend-dot attack-dot" /><span>Both attack</span><strong>{num(agreement.both_attack)}</strong></div>
        <div><i className="legend-dot disagree-dot" /><span>Disagree</span><strong>{num(agreement.disagree)}</strong></div>
      </div>
      <p className="chart-note">Agreement is descriptive; it is not a separate trained model.</p>
    </article>
  );
}

function HistogramChart({ bins = [], threshold }) {
  if (!bins.length) return null;
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <article className="live-chart-card wide-chart-card">
      <div className="chart-card-head">
        <div><span className="eyebrow">LIVE CSV</span><h3>Autoencoder reconstruction-error distribution</h3></div>
        <span className="chart-badge">Threshold {Number(threshold || 0).toFixed(4)}</span>
      </div>
      <div className="histogram" title="Histogram of reconstruction errors for this upload">
        {bins.map((bin, index) => (
          <div className="hist-column" key={`${bin.start}-${index}`}>
            <div className="hist-value">{bin.count}</div>
            <i
              className={bin.above_threshold ? 'anomaly-bin' : ''}
              style={{ height: `${Math.max(5, (bin.count / max) * 100)}%` }}
              title={`${Number(bin.start).toFixed(3)}–${Number(bin.end).toFixed(3)}: ${bin.count} flows`}
            />
          </div>
        ))}
      </div>
      <div className="hist-axis"><span>Lower reconstruction error</span><span>Higher / more anomalous</span></div>
      <p className="chart-note">Bars are rebuilt from all Autoencoder reconstruction errors in the uploaded CSV.</p>
    </article>
  );
}

function LstmTrendChart({ points = [] }) {
  if (!points.length) return null;
  const width = 900;
  const height = 220;
  const padX = 20;
  const padY = 20;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const pathPoints = points.map((point, index) => {
    const x = padX + (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
    const y = padY + (1 - Math.max(0, Math.min(1, Number(point.attack_probability)))) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const thresholdY = padY + 0.5 * plotH;
  return (
    <article className="live-chart-card wide-chart-card">
      <div className="chart-card-head">
        <div><span className="eyebrow">LIVE CSV</span><h3>LSTM attack-probability trend</h3></div>
        <span className="chart-badge">up to {points.length} sampled windows</span>
      </div>
      <div className="line-chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="LSTM attack probability trend">
          <line x1={padX} y1={thresholdY} x2={width - padX} y2={thresholdY} className="chart-threshold" />
          <line x1={padX} y1={padY} x2={padX} y2={height - padY} className="chart-axis-line" />
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} className="chart-axis-line" />
          <polyline points={pathPoints} className="trend-line" />
        </svg>
        <div className="trend-label top">100% attack probability</div>
        <div className="trend-label middle">50% decision boundary</div>
        <div className="trend-label bottom">0%</div>
      </div>
      <p className="chart-note">The line changes with sequence-level predictions from each uploaded CSV.</p>
    </article>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(FALLBACK_METRICS);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/metrics`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => data && Object.keys(data).length && setMetrics(data))
      .catch(() => {});

    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline' }));
  }, []);

  const backendOnline = health?.status === 'ok' || health?.status === 'degraded';

  const modelRows = useMemo(() => {
    if (!result?.models) return [];
    return [
      ['Logistic Regression', result.models.logistic_regression],
      ['LSTM', result.models.lstm],
      ['Autoencoder', result.models.autoencoder],
    ];
  }, [result]);

  function pickFile(selected) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.');
      return;
    }
    setFile(selected);
    setError('');
    setResult(null);
  }

  async function analyze() {
    if (!file) {
      setError('Choose a CICDDoS/CICFlowMeter-style CSV first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await fetch(`${API_BASE}/api/predict`, { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Prediction failed.');
      setResult(data);
      setTimeout(() => document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.message || 'Could not reach the backend.');
    } finally {
      setLoading(false);
    }
  }

  const live = result?.live_analytics;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#top" className="brand"><span className="brand-mark"><ShieldCheck size={22} /></span><span>Sentinel<span>Flow</span></span></a>
        <nav>
          <a href="#analyze">Analyze</a>
          <a href="#models">Models</a>
          <a href="#research">Research</a>
        </nav>
        <div className={`status-pill ${backendOnline ? 'online' : 'offline'}`}>
          <span className="dot" /> {backendOnline ? 'Backend ready' : 'Backend offline'}
        </div>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-copy">
            <div className="kicker"><span></span>CICDDoS2019 • 68 flow features • 3 trained models</div>
            <h1>Detect DDoS traffic before it becomes <em>service disruption.</em></h1>
            <p>
              An end-to-end ML dashboard combining supervised classification, temporal sequence learning,
              and benign-only anomaly detection. Upload a compatible flow CSV and the live analytics update for that file.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#analyze"><ScanSearch size={18} />Analyze traffic</a>
              <a className="ghost-button" href="/sample_network_flows.csv" download><Download size={18} />Download sample CSV</a>
            </div>
            <div className="hero-facts">
              <div><strong>CICDDoS2019</strong><span>network-flow dataset</span></div>
              <div><strong>8 × 68</strong><span>LSTM sequence input</span></div>
              <div><strong>3 models</strong><span>multi-view detection</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="grid-plane"></div>
            <div className="core"><Shield size={54} strokeWidth={1.4} /></div>
            <div className="orbit orbit-a"><span></span><span></span><span></span></div>
            <div className="orbit orbit-b"><span></span><span></span></div>
            <div className="pulse-card p1"><Activity size={16} /><div><small>LSTM</small><b>99.86%</b></div></div>
            <div className="pulse-card p2"><Waves size={16} /><div><small>Recall</small><b>99.79%</b></div></div>
            <div className="pulse-card p3"><Zap size={16} /><div><small>Live mode</small><b>CSV</b></div></div>
          </div>
        </section>

        <section className="section trust-strip">
          <div><Database size={18} /><span>CICDDoS2019 traffic</span></div>
          <div><Network size={18} /><span>Temporal sequence modeling</span></div>
          <div><Shield size={18} /><span>Benign-only anomaly learning</span></div>
          <div><BarChart3 size={18} /><span>Live upload analytics</span></div>
        </section>

        <section className="section capability-section">
          <div className="section-heading">
            <div><span className="eyebrow">PROJECT CAPABILITIES</span><h2>Research results plus live inference.</h2></div>
            <p>The dashboard separates fixed held-out-test evidence from CSV-specific analytics, so the presentation stays scientifically correct and visibly interactive.</p>
          </div>
          <div className="capability-grid">
            <article><Layers3 size={22} /><strong>Supervised baseline</strong><span>Logistic Regression classifies each network flow.</span></article>
            <article><Activity size={22} /><strong>Temporal detection</strong><span>LSTM evaluates ordered 8-flow sequences.</span></article>
            <article><Waves size={22} /><strong>Anomaly detection</strong><span>Autoencoder measures reconstruction error against a learned threshold.</span></article>
            <article><BarChart3 size={22} /><strong>Dynamic analytics</strong><span>Charts rebuild automatically after every CSV upload.</span></article>
          </div>
        </section>

        <section className="section analyze-section" id="analyze">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TRAFFIC ANALYZER</span>
              <h2>Upload a flow CSV. Get three views of risk.</h2>
            </div>
            <p>Required input: the same 68 CICFlowMeter numeric features used during training. Timestamp and SourceCSV are optional but improve LSTM ordering.</p>
          </div>

          <div className="analyze-layout">
            <div
              className={`dropzone ${dragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
            >
              <div className="upload-icon"><Upload size={28} /></div>
              <h3>{file ? file.name : 'Drop a CSV here'}</h3>
              <p>{file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'or browse from your computer'}</p>
              <label className="file-button">
                Choose CSV
                <input type="file" accept=".csv,text/csv" onChange={(e) => pickFile(e.target.files?.[0])} />
              </label>
              <button className="analyze-button" onClick={analyze} disabled={loading || !file}>
                {loading ? <><span className="spinner" />Running models...</> : <><FileSearch size={18} />Run analysis</>}
              </button>
              {error && <div className="error-box"><XCircle size={18} />{error}</div>}
            </div>

            <div className="input-guide">
              <span className="eyebrow">WHAT HAPPENS</span>
              <div className="step"><b>01</b><div><strong>Normalize</strong><span>68 flow features are cleaned and scaled using the saved training StandardScaler.</span></div></div>
              <div className="step"><b>02</b><div><strong>Classify</strong><span>Logistic Regression scores each flow; LSTM scores 8-flow sequences.</span></div></div>
              <div className="step"><b>03</b><div><strong>Detect anomalies</strong><span>The Autoencoder flags flows whose reconstruction error exceeds the saved threshold.</span></div></div>
              <div className="step"><b>04</b><div><strong>Rebuild analytics</strong><span>Traffic, agreement, anomaly, and LSTM trend charts are generated for this CSV.</span></div></div>
            </div>
          </div>
        </section>

        {result && (
          <section className="section results-section" id="analysis-results">
            <div className="section-heading">
              <div><span className="eyebrow">LIVE ANALYSIS RESULT</span><h2>{result.filename}</h2></div>
              <div className="success-pill"><CheckCircle2 size={16} />{result.rows.toLocaleString()} rows processed</div>
            </div>

            <div className="result-overview">
              <ThreatMeter rate={result.primary_attack_rate} />
              <div className="summary-stack">
                <div><span>Primary model</span><strong>{result.primary_model}</strong></div>
                <div><span>Features</span><strong>{result.feature_count}</strong></div>
                <div><span>LSTM sequences</span><strong>{result.models?.lstm?.evaluated_sequences?.toLocaleString?.() || 0}</strong></div>
                <div><span>Charts</span><strong>Updated for this CSV</strong></div>
              </div>
            </div>

            <div className="live-model-grid">
              {modelRows.map(([name, model]) => (
                <article key={name} className="live-model-card">
                  <div className="live-model-title"><span>{name}</span><b className={model?.available ? 'ok' : 'warn'}>{model?.available ? 'READY' : 'UNAVAILABLE'}</b></div>
                  {model?.available ? (
                    <>
                      <strong className="big-rate">{model.attack_rate !== undefined ? pct(model.attack_rate, 1) : '—'}</strong>
                      <span className="muted">predicted attack rate</span>
                      <div className="bar"><i style={{ width: `${Math.min(100, (model.attack_rate || 0) * 100)}%` }} /></div>
                      <div className="mini-stats">
                        <span>Attacks <b>{model.attack_count ?? '—'}</b></span>
                        <span>Benign <b>{model.benign_count ?? '—'}</b></span>
                      </div>
                    </>
                  ) : <p className="muted small">TensorFlow model was not loaded by the backend.</p>}
                </article>
              ))}
            </div>

            <div className="dynamic-analytics-heading">
              <div><span className="eyebrow">DYNAMIC GRAPHS</span><h3>These change with every CSV upload.</h3></div>
              <span><Activity size={15} /> Live prediction analytics</span>
            </div>

            <div className="live-charts-grid">
              <TrafficDistributionChart data={live?.primary_distribution} />
              <ModelAttackRateChart rows={live?.model_attack_rates || []} />
              <AgreementChart agreement={live?.logistic_autoencoder_agreement} />
              <HistogramChart bins={live?.autoencoder_histogram || []} threshold={result.models?.autoencoder?.threshold} />
              <LstmTrendChart points={live?.lstm_probability_trend || []} />
            </div>

            <div className="prediction-table-wrap">
              <div className="table-heading"><div><span className="eyebrow">SAMPLE FLOWS</span><h3>Per-flow predictions</h3></div><span>First {result.sample_flow_predictions?.length || 0} rows</span></div>
              <div className="prediction-table">
                <div className="table-row table-head"><span>Row</span><span>Logistic</span><span>Probability</span><span>Autoencoder</span><span>Recon. error</span></div>
                {(result.sample_flow_predictions || []).slice(0, 20).map((row) => (
                  <div className="table-row" key={row.row}>
                    <span>#{row.row}</span>
                    <span className={row.logistic_prediction === 'DDoS' ? 'danger-text' : 'safe-text'}>{row.logistic_prediction}</span>
                    <span>{pct(row.logistic_probability)}</span>
                    <span className={row.autoencoder_prediction === 'DDoS' ? 'danger-text' : 'safe-text'}>{row.autoencoder_prediction || '—'}</span>
                    <span>{row.reconstruction_error !== undefined ? row.reconstruction_error.toFixed(4) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section" id="models">
          <div className="section-heading">
            <div><span className="eyebrow">FIXED RESEARCH PERFORMANCE</span><h2>Three models. Different detection strategies.</h2></div>
            <p>These values are the original held-out-test metrics from model development. They stay fixed when a new CSV is uploaded.</p>
          </div>
          <div className="fixed-metrics-notice"><AlertTriangle size={17} /><span>Live CSV charts above change on every upload. The model-performance metrics below are intentionally fixed research evidence.</span></div>
          <div className="models-grid">
            <ModelMetricCard name="Logistic Regression" metrics={metrics['Logistic Regression'] || FALLBACK_METRICS['Logistic Regression']} icon={Layers3} note="Supervised baseline on individual network flows." />
            <ModelMetricCard name="Temporal LSTM" metrics={metrics.LSTM || FALLBACK_METRICS.LSTM} icon={Activity} note="8-flow ordered sequences within source traffic files." />
            <ModelMetricCard name="Autoencoder" metrics={metrics.Autoencoder || FALLBACK_METRICS.Autoencoder} icon={Waves} note="Unsupervised anomaly detector trained only on BENIGN traffic." />
          </div>
        </section>

        <section className="section research-section" id="research">
          <div className="section-heading">
            <div><span className="eyebrow">OFFLINE RESEARCH OUTPUT</span><h2>Evaluation plots from the trained experiment.</h2></div>
            <p>These plots come from the original notebook evaluation and remain fixed. They provide evidence of model training and held-out testing.</p>
          </div>
          <div className="gallery-grid">
            <figure className="wide"><img src="/graphs/final_model_comparison.png" alt="Final model comparison" /><figcaption>Held-out test model comparison — fixed research result</figcaption></figure>
            <figure><img src="/graphs/lstm_confusion_matrix.png" alt="LSTM confusion matrix" /><figcaption>LSTM confusion matrix</figcaption></figure>
            <figure><img src="/graphs/autoencoder_reconstruction_error.png" alt="Autoencoder reconstruction error" /><figcaption>Autoencoder reconstruction error</figcaption></figure>
            <figure><img src="/graphs/lstm_training_loss.png" alt="LSTM training loss" /><figcaption>LSTM training loss</figcaption></figure>
            <figure><img src="/graphs/02_attack_type_distribution.png" alt="Attack type distribution" /><figcaption>Attack type distribution</figcaption></figure>
          </div>
        </section>

        <section className="section architecture">
          <span className="eyebrow">DEPLOYMENT PIPELINE</span>
          <h2>From uploaded flow data to live threat analytics.</h2>
          <div className="pipeline">
            <div><Database /><strong>CICDDoS2019</strong><span>network-flow data</span></div><i></i>
            <div><Zap /><strong>Preprocess</strong><span>68 scaled features</span></div><i></i>
            <div><Layers3 /><strong>LR</strong><span>flow classifier</span></div><i></i>
            <div><Activity /><strong>LSTM</strong><span>8-flow sequence</span></div><i></i>
            <div><Waves /><strong>Autoencoder</strong><span>anomaly score</span></div>
          </div>
        </section>
      </main>

      <footer>
        <div><span className="brand-mark small-mark"><ShieldCheck size={18} /></span><strong>SentinelFlow</strong></div>
        <p>Academic ML project • CICDDoS2019 • Logistic Regression + LSTM + Autoencoder</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
