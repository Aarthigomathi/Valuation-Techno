import { useEffect, useRef, useState } from 'react';
import { api, inr } from '../api.js';

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
    <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
    <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (animated / 100) * circ} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .3s' }} />
    <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="800" fill={color}>{Math.round(animated)}</text><text x="60" y="76" textAnchor="middle" fontSize="10" fill="#64748b">fraud / 100 · {risk}</text></svg>
    <div className="muted">killfake.ai deepfake & tamper score</div></div>;
}

const HOTSPOTS = { FRONT: [100, 18], REAR: [100, 182], LEFT: [28, 100], RIGHT: [172, 100], ENGINE: [100, 48], TIRE: [40, 165], ODOMETER: [100, 82], DAMAGE: [140, 120], TOP: [100, 100], INTERIOR: [100, 105] };
export function CarTwin({ detections = [] }) {
  return <div style={{ textAlign: 'center' }}><svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Vehicle digital twin with damage hotspots">
    <rect x="55" y="10" width="90" height="180" rx="38" fill="#dbeafe" stroke="#0b6bcb" strokeWidth="2" />
    <rect x="68" y="55" width="64" height="55" rx="12" fill="#bfdbfe" /><rect x="72" y="125" width="56" height="38" rx="10" fill="#bfdbfe" />
    <circle cx="52" cy="42" r="10" fill="#1e293b" /><circle cx="148" cy="42" r="10" fill="#1e293b" /><circle cx="52" cy="158" r="10" fill="#1e293b" /><circle cx="148" cy="158" r="10" fill="#1e293b" />
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
    <svg width="100%" viewBox="0 0 600 150"><polyline className="chartline" fill="none" stroke="#0b6bcb" strokeWidth="2.5" points={pt(data.trend)} /><polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 4" points={pt(data.forecast, data.trend.length - 1)} />
      {all.map((d, i) => <text key={i} x={(i / (all.length - 1)) * 560 + 14} y="145" fontSize="8" fill="#64748b">{d.month}</text>)}</svg>
    <p>Current market {inr(data.current)} · AI forecast {data.forecastChangePct >= 0 ? '▲' : '▼'} {Math.abs(data.forecastChangePct)}% / 3 mo · Comparables: {data.comparables.map((c) => `${c.city} ${inr(c.price)}`).join(' · ')}</p></div>;
}

export function LiveMap({ job }) {
  if (!job) return null; const els = job.eligibleInspectors || [];
  return <div><h3>🗺️ Live Broadcast Map</h3><svg width="100%" viewBox="0 0 400 220" style={{ background: '#eff6ff', borderRadius: 12 }}>
    <circle cx="200" cy="110" r="85" fill="none" stroke="#0b6bcb" strokeDasharray="5 5" className="pulse-ring" /><circle cx="200" cy="110" r="7" fill="#0b2a4a" /><text x="200" y="95" textAnchor="middle" fontSize="10">🚗 {job.regNumber}</text>
    {els.map((e, i) => { const ang = (i / Math.max(1, els.length)) * Math.PI * 2; const dist = Math.min(80, 15 + (e.distanceKm || 5) * 2.5); const x = 200 + Math.cos(ang) * dist; const y = 110 + Math.sin(ang) * dist;
      return <g key={e.id}><circle className="hotspot" cx={x} cy={y} r="6" fill="#16a34a" /><text x={x} y={y - 10} textAnchor="middle" fontSize="8">{e.name.split(' ').pop()} ★{e.rating} · {e.distanceKm}km</text></g>; })}
    {job.assignedInspector && <text x="200" y="208" textAnchor="middle" fontSize="10" fill="#15803d">Assigned: {job.assignedInspector.name}</text>}
    <text x="200" y="15" textAnchor="middle" fontSize="9" fill="#64748b">Broadcast radius {job.broadcastRadiusKm} km · {job.allocationMode}</text></svg></div>;
}

export function AnalyticsPanel() {
  const [a, setA] = useState(null);
  useEffect(() => { api('/analytics').then(setA).catch(() => {}); const id = setInterval(() => api('/analytics').then(setA).catch(() => {}), 15000); return () => clearInterval(id); }, []);
  if (!a) return <p className="muted">Loading AI analytics…</p>;
  const jobs = useCountUp(a.jobsTotal); const settled = useCountUp(a.settledValue);
  const bar = (label, n, max, color) => <div key={label}><label>{label}: {n}</label><div style={{ background: '#e2e8f0', borderRadius: 8, height: 12 }}><div style={{ width: `${max ? (n / max) * 100 : 0}%`, background: color, height: 12, borderRadius: 8, transition: 'width 1s' }} /></div></div>;
  const fmax = Math.max(1, a.fraud.low, a.fraud.medium, a.fraud.high);
  return <div><div className="grid"><div className="card"><div className="muted">Total jobs</div><div className="stat">{Math.round(jobs)}</div></div><div className="card"><div className="muted">Settled value</div><div className="stat">{inr(settled)}</div></div><div className="card"><div className="muted">Green-flag rate</div><div className="stat">{a.greenPct}%</div></div><div className="card"><div className="muted">Avg variance</div><div className="stat">{a.avgVariance}%</div></div><div className="card"><div className="muted">Users online (live)</div><div className="stat">{a.onlineUsers}</div></div></div>
    <div className="card"><h3>🛡️ Fraud Risk Distribution (avg score {a.fraud.avgScore}/100)</h3>{bar('LOW', a.fraud.low, fmax, '#16a34a')}{bar('MEDIUM', a.fraud.medium, fmax, '#f59e0b')}{bar('HIGH', a.fraud.high, fmax, '#dc2626')}<p className="ok">🤖 AI Insight: {a.insight} Next-month volume forecast: ~{a.volumeForecastNextMonth} jobs.</p></div>
    <div className="card"><h3>🏆 Inspector Leaderboard</h3><table><thead><tr><th>Inspector</th><th>Rating</th><th>Rated jobs</th><th>Status</th></tr></thead><tbody>{a.leaderboard.map((u) => <tr key={u.id}><td>{u.name}</td><td>★ {u.rating}</td><td>{u.ratingCount}</td><td>{u.status}</td></tr>)}</tbody></table></div></div>;
}
