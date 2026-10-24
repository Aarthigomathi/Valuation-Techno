import { Component, useEffect, useState } from 'react';
import { api, inr } from '../api.js';

// Safety net: a crashing panel shows a message + recovery, never a white screen.
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) return <div className="card"><h3>⚠️ This panel could not be loaded</h3><p className="muted">{String(this.state.err.message || this.state.err)}</p><button onClick={() => this.setState({ err: null })}>↺ Try Again</button></div>;
    return this.props.children;
  }
}

export function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => { if (target === null || target === undefined) return; let raf; const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(Number(target) * (1 - Math.pow(1 - p, 3)) * 100) / 100); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [target]);
  return v;
}

export function FraudGauge({ score = 0, risk = 'LOW' }) {
  const pct = Math.min(100, score); const circ = 2 * Math.PI * 52; const color = risk === 'HIGH' ? '#dc2626' : risk === 'MEDIUM' ? '#f59e0b' : '#16a34a';
  const animated = useCountUp(pct);
  return <div style={{ textAlign: 'center', minWidth: 150 }}><svg width="140" height="140" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="52" fill="none" stroke="#1e2d49" strokeWidth="10" />
    <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (animated / 100) * circ} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .3s' }} />
    <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="800" fill={color}>{Math.round(animated)}</text><text x="60" y="76" textAnchor="middle" fontSize="10" fill="#8fa3bf">fraud / 100 · {risk}</text></svg>
    <div className="muted">killfake.ai deepfake & tamper score</div></div>;
}

const HOTSPOTS = { FRONT: [100, 18], REAR: [100, 182], LEFT: [28, 100], RIGHT: [172, 100], ENGINE: [100, 48], TIRE: [40, 165], ODOMETER: [100, 82], DAMAGE: [140, 120], TOP: [100, 100], INTERIOR: [100, 105] };
export function CarTwin({ detections = [] }) {
  return <div style={{ textAlign: 'center' }}><svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Vehicle digital twin with damage hotspots">
    <rect x="55" y="10" width="90" height="180" rx="38" fill="#12263f" stroke="#38bdf8" strokeWidth="2" />
    <rect x="68" y="55" width="64" height="55" rx="12" fill="#1d4ed8" /><rect x="72" y="125" width="56" height="38" rx="10" fill="#2563eb" />
    <circle cx="52" cy="42" r="10" fill="#020617" stroke="#38bdf8" /><circle cx="148" cy="42" r="10" fill="#1e293b" /><circle cx="52" cy="158" r="10" fill="#020617" stroke="#38bdf8" /><circle cx="148" cy="158" r="10" fill="#1e293b" />
    {detections.map((d, i) => { const [x, y] = HOTSPOTS[d.category] || HOTSPOTS.DAMAGE; return <g key={i}><circle className="hotspot" cx={x} cy={y} r="8" fill="#dc2626" opacity="0.85"><title>{d.type} · {d.part} · {d.severity} · {inr(d.estimatedCost)}</title></circle><circle className="hotspot-ring" cx={x} cy={y} r="8" fill="none" stroke="#dc2626" /></g>; })}
  </svg><div className="muted">🚗 Vehicle Digital Twin — {detections.length} AI damage hotspot(s), hover to inspect</div></div>;
}

export function AiScanPanel({ analysis }) {
  const items = analysis?.damage?.detections || []; const [active, setActive] = useState(0);
  useEffect(() => { if (!items.length) return; const id = setInterval(() => setActive((a) => (a + 1) % items.length), 1200); return () => clearInterval(id); }, [items.length]);
  if (!analysis) return null;
  return <div className="scanbox"><div className="scanline" /><b>🤖 AI Vision Scan</b> · YOLOv8-SIM + Mask R-CNN-SIM · Tire wear {analysis.damage.tireWearPct}%
    {items.map((d, i) => <div key={i} className={i === active ? 'scan-active' : 'muted'}>{i === active ? '▣' : '·'} {d.part} — {d.type} ({d.severity}) · {Math.round(d.confidence * 100)}% confidence · {inr(d.estimatedCost)}</div>)}
    {items.length === 0 && <div className="muted">No damage detected — vehicle scanned clean.</div>}</div>;
}

export function MarketChart({ make, model }) {
  const [data, setData] = useState(null);
  useEffect(() => { api(`/market?make=${encodeURIComponent(make || 'Hyundai')}&model=${encodeURIComponent(model || 'Creta')}`).then(setData).catch(() => {}); }, [make, model]);
  if (!data) return <p className="muted">Loading DeepSearch market intelligence…</p>;
  const all = [...data.trend, ...data.forecast]; const max = Math.max(...all.map((x) => x.value)) * 1.05; const min = Math.min(...all.map((x) => x.value)) * 0.95;
  const pt = (arr, off = 0) => arr.map((d, i) => `${((i + off) / (all.length - 1)) * 560 + 20},${130 - ((d.value - min) / (max - min)) * 110}`).join(' ');
  return <div><h3>📈 DeepSearch Live Market — {data.make} {data.model}</h3>
    <svg width="100%" viewBox="0 0 600 150"><polyline className="chartline" fill="none" stroke="#38bdf8" strokeWidth="2.5" points={pt(data.trend)} /><polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 4" points={pt(data.forecast, data.trend.length - 1)} />
      {all.map((d, i) => <text key={i} x={(i / (all.length - 1)) * 560 + 14} y="145" fontSize="8" fill="#8fa3bf">{d.month}</text>)}</svg>
    <p>Current market {inr(data.current)} · AI forecast {data.forecastChangePct >= 0 ? '▲' : '▼'} {Math.abs(data.forecastChangePct)}% / 3 mo · Comparables: {data.comparables.map((c) => `${c.city} ${inr(c.price)}`).join(' · ')}</p></div>;
}

export function LiveMap({ job }) {
  if (!job) return null;
  const els = job.eligibleInspectors || [];
  const cx = 360;
  const cy = 188;
  const broadcastRadius = 118;

  // Place inspectors in separate sectors of the circle. Previously, markers were
  // positioned mainly by distance, so nearby inspectors and the vehicle label
  // were drawn almost on top of each other.
  const slotAngles = (count) => {
    if (count === 1) return [180];
    if (count === 2) return [180, 0];
    if (count === 3) return [180, -90, 0];
    if (count === 4) return [180, -90, 0, 90];
    return Array.from({ length: count }, (_, i) => 180 + (360 / count) * i);
  };
  const angles = slotAngles(els.length);
  const points = els.map((inspector, index) => {
    const radians = (angles[index] * Math.PI) / 180;
    const markerX = cx + Math.cos(radians) * 96;
    const markerY = cy + Math.sin(radians) * 96;
    const displayName = String(inspector.name || 'Inspector').replace(/^Inspector\s+/i, '');
    const label = `${displayName} ★${inspector.rating} · ${inspector.distanceKm} km`;
    const labelWidth = Math.max(132, label.length * 6.7);
    const labelX = Math.min(720 - labelWidth / 2 - 10, Math.max(labelWidth / 2 + 10, cx + Math.cos(radians) * 158));
    const labelY = Math.min(330, Math.max(58, cy + Math.sin(radians) * 158));
    return { inspector, label, labelWidth, markerX, markerY, labelX, labelY };
  });
  const vehicleLabel = `Vehicle · ${job.regNumber}`;
  const vehicleLabelWidth = Math.max(148, vehicleLabel.length * 7.2);

  return <div>
    <h3>🗺️ Live Broadcast Map</h3>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
      <span className="pill">Broadcast radius: {job.broadcastRadiusKm} km</span>
      <span className="pill">Allocation: {job.allocationMode}</span>
      <span className="pill">Eligible inspectors: {els.length}</span>
      {job.assignedInspector && <span className="pill">Assigned: {job.assignedInspector.name}</span>}
    </div>

    <svg width="100%" viewBox="0 0 720 360" role="img" aria-label="Live broadcast map showing the vehicle and eligible inspectors" style={{ background: 'linear-gradient(180deg,#0a1424,#0d1b2e)', border: '1px solid #1e2d49', borderRadius: 14, display: 'block' }}>
      <circle cx={cx} cy={cy} r={broadcastRadius} fill="rgba(56,189,248,.10)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="7 6" className="pulse-ring" />
      <circle cx={cx} cy={cy} r="58" fill="none" stroke="#1d4ed8" strokeWidth="1.5" />

      {points.map(({ inspector, label, labelWidth, markerX, markerY, labelX, labelY }) => (
        <g key={inspector.id}>
          <line x1={markerX} y1={markerY} x2={labelX} y2={labelY} stroke="#2563eb" strokeWidth="1.5" />
          <circle cx={markerX} cy={markerY} r="10" fill="#0d1626" stroke="#34d399" strokeWidth="2" />
          <circle className="hotspot" cx={markerX} cy={markerY} r="5.5" fill="#16a34a" />
          <rect x={labelX - labelWidth / 2} y={labelY - 16} width={labelWidth} height="32" rx="16" fill="#101d33" stroke="#27405f" />
          <text x={labelX} y={labelY + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#e7eefb">{label}</text>
        </g>
      ))}

      <text x={cx} y={cy - 18} textAnchor="middle" fontSize="22">🚗</text>
      <circle cx={cx} cy={cy + 3} r="7" fill="#38bdf8" stroke="#0a1424" strokeWidth="2" />
      <rect x={cx - vehicleLabelWidth / 2} y={cy + 20} width={vehicleLabelWidth} height="30" rx="15" fill="#2563eb" />
      <text x={cx} y={cy + 39} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{vehicleLabel}</text>
    </svg>

    {els.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      {els.map((inspector) => <span key={inspector.id} className="pill" style={{ background: 'rgba(52,211,153,.13)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,.3)' }}>
        {inspector.name} · ★{inspector.rating} · {inspector.distanceKm} km away
      </span>)}
    </div>}
    {job.assignedInspector && <p style={{ color: '#34d399', fontWeight: 700, marginBottom: 0 }}>Assigned inspector: {job.assignedInspector.name}</p>}
  </div>;
}

export function AnalyticsPanel() {
  const [a, setA] = useState(null); const [loadErr, setLoadErr] = useState('');
  // ALL hooks must run before any early return — calling useCountUp after `if (!a)` crashes React (white screen).
  const jobs = useCountUp(a?.jobsTotal ?? 0); const settled = useCountUp(a?.settledValue ?? 0);
  useEffect(() => { const load = () => api('/analytics').then((d) => { setA(d); setLoadErr(''); }).catch((e) => setLoadErr(e.message)); load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);
  if (loadErr) return <div className="card"><h3>⚠️ AI Analytics could not be loaded</h3><p className="muted">{loadErr}</p></div>;
  if (!a) return <p className="muted">⏳ Loading AI analytics…</p>;
  const fraud = a.fraud || { low: 0, medium: 0, high: 0, avgScore: 0 }; const leaderboard = a.leaderboard || [];
  const bar = (label, n, max, color) => <div key={label}><label>{label}: {n}</label><div style={{ background: '#1e2d49', borderRadius: 8, height: 12 }}><div style={{ width: `${max ? (n / max) * 100 : 0}%`, background: color, height: 12, borderRadius: 8, transition: 'width 1s' }} /></div></div>;
  const fmax = Math.max(1, fraud.low, fraud.medium, fraud.high);
  return <div><div className="grid"><div className="card"><div className="muted">Total jobs</div><div className="stat">{Math.round(jobs)}</div></div><div className="card"><div className="muted">Settled value</div><div className="stat">{inr(settled)}</div></div><div className="card"><div className="muted">Green-flag rate</div><div className="stat">{a.greenPct}%</div></div><div className="card"><div className="muted">Avg variance</div><div className="stat">{a.avgVariance}%</div></div><div className="card"><div className="muted">Users online (live)</div><div className="stat">{a.onlineUsers}</div></div></div>
    <div className="card"><h3>🛡️ Fraud Risk Distribution (avg score {fraud.avgScore}/100)</h3>{bar('LOW', fraud.low, fmax, '#16a34a')}{bar('MEDIUM', fraud.medium, fmax, '#f59e0b')}{bar('HIGH', fraud.high, fmax, '#dc2626')}<p className="ok">🤖 AI Insight: {a.insight} Next-month volume forecast: ~{a.volumeForecastNextMonth} jobs.</p></div>
    <div className="card"><h3>🏆 Inspector Leaderboard</h3><table><thead><tr><th>Inspector</th><th>Rating</th><th>Rated jobs</th><th>Status</th></tr></thead><tbody>{leaderboard.map((u) => <tr key={u.id}><td>{u.name}</td><td>★ {u.rating}</td><td>{u.ratingCount}</td><td>{u.status}</td></tr>)}</tbody></table>{leaderboard.length === 0 && <p className="muted">No inspectors yet.</p>}</div></div>;
}
