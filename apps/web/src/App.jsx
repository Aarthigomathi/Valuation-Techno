import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { api, token, sessionUser, setSession, clearSession, inr, fmtDate } from './api.js';

const PHASES = ['BROADCAST', 'ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_SUBMITTED', 'AUDIT_REQUIRED', 'REPORT_DELIVERED', 'SETTLED'];
function StatusPill({ s }) { return <span className="pill">{s}</span>; }
function Stepper({ status }) { const idx = PHASES.indexOf(status); return <div className="stepper">{PHASES.map((p, i) => <span key={p} className={`step ${i <= idx ? 'on' : ''}`}>{p.replaceAll('_', ' ')}</span>)}</div>; }

function Login() {
  const nav = useNavigate(); const [form, setForm] = useState({ email: '', password: '' }); const [reg, setReg] = useState({ name: '', email: '', password: '', phone: '', role: 'LOAN_SEEKER' });
  const [err, setErr] = useState(''); const [mode, setMode] = useState('login'); const [otp, setOtp] = useState(null);
  const doLogin = async (email, password) => { try { const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setSession(d.token, d.user); nav('/dashboard'); } catch (e) { setErr(e.message); } };
  const demos = [['Bank (HDFC)', 'bank@valuation.techno', 'Bank@123'], ['Inspector Ravi ★4.6', 'inspector@valuation.techno', 'Inspector@123'], ['Loan Seeker', 'seeker@valuation.techno', 'Seeker@123'], ['Platform Admin', 'admin@valuation.techno', 'Admin@123']];
  return <div className="wrap"><div className="card login"><h1>Valuation Techno</h1><p className="muted">Smart Valuation. Safer Transactions — AI-powered used vehicle valuation & FinTech platform.</p>
    {err && <div className="err">{err}</div>}
    <div className="tabs"><button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Login</button><button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Register</button><button className={mode === 'otp' ? 'on' : ''} onClick={() => setMode('otp')}>OTP Login</button></div>
    {mode === 'login' && <><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@bank.com" /><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button style={{ width: '100%' }} onClick={() => doLogin(form.email, form.password)}>Login</button>
      <p className="muted">One-click demo accounts:</p><div className="demo">{demos.map(([l, e, p]) => <button key={e} className="ghost" onClick={() => doLogin(e, p)}>{l} · <span className="kbd">{e}</span></button>)}</div></>}
    {mode === 'register' && <><label>Full name</label><input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} /><label>Email</label><input value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} /><label>Phone</label><input value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} placeholder="+91..." /><label>Role</label><select value={reg.role} onChange={(e) => setReg({ ...reg, role: e.target.value })}><option value="BANK">Bank</option><option value="INSPECTOR">Inspector</option><option value="LOAN_SEEKER">Loan Seeker</option></select><label>Password</label><input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} /><button style={{ width: '100%' }} onClick={async () => { try { const d = await api('/auth/register', { method: 'POST', body: JSON.stringify(reg) }); setSession(d.token, d.user); nav('/dashboard'); } catch (e) { setErr(e.message); } }}>Create account</button></>}
    {mode === 'otp' && <><label>Phone (use a demo phone e.g. +919000000003)</label><input id="otp-phone" placeholder="+919000000003" /><button className="ghost" onClick={async () => { try { const d = await api('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone: document.getElementById('otp-phone').value }) }); setOtp(d.demoOtp); } catch (e) { setErr(e.message); } }}>Send OTP</button>{otp && <p className="ok">Demo OTP: <b>{otp}</b> (shown only in demo mode)</p>}<label>OTP</label><input id="otp-code" /><button style={{ width: '100%' }} onClick={async () => { try { const d = await api('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone: document.getElementById('otp-phone').value, code: document.getElementById('otp-code').value }) }); setSession(d.token, d.user); nav('/dashboard'); } catch (e) { setErr(e.message); } }}>Verify & Login</button></>}
  </div></div>;
}

function JobDetail({ job, user, reload }) {
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const act = async (path, body) => { try { await api(path, { method: 'POST', body: JSON.stringify(body || {}) }); setMsg('Done'); reload(); } catch (e) { setErr(e.message); } };
  if (!job) return null; const v = job.valuation;
  return <div className="card"><h2>{job.make} {job.model} {job.variant || ''} ({job.year}) · {job.regNumber}</h2><Stepper status={job.status} />
    <p><StatusPill s={job.status} /> <span className="muted">Loan: {job.loanRef || '—'} · Seeker: {job.seekerName} · Fee: {inr(job.valuationFee)} · Mode: {job.allocationMode} · Radius: {job.broadcastRadiusKm} km</span></p>
    {msg && <div className="ok">{msg}</div>}{err && <div className="err">{err}</div>}
    {job.verification && <details open><summary><b>Vehicle Verification (VAHAN / IIB)</b></summary><table><tbody>{job.verification.checks?.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.status}</td><td>{c.detail}</td></tr>)}</tbody></table><p className="muted">Accidents: {job.verification.history?.accidentCount} · Claims: {job.verification.history?.claimCount} · Owners: {job.verification.ownership?.ownersCount} · Insurance valid: {job.verification.insurance?.valid ? 'Yes' : 'No'}</p></details>}
    {job.assignedInspector && <p>Inspector: <b>{job.assignedInspector.name}</b> ★ {job.assignedInspector.rating} ({job.assignedInspector.status})</p>}
    {!job.assignedInspector && job.eligibleInspectors?.length > 0 && <p className="muted">Eligible inspectors in radius: {job.eligibleInspectors.map((i) => `${i.name} ★${i.rating} (${i.distanceKm} km)`).join(' · ')}</p>}
    {v && <div><h3>Dual Valuation</h3><table><tbody><tr><td>Market (DeepSearch)</td><td>{inr(v.marketValue)}</td><td>AI Valuation</td><td>{inr(v.aiValuation)}</td></tr><tr><td>Manual Valuation</td><td>{inr(v.manualValuation)}</td><td>Variance</td><td>{v.variancePct}% <span className={`flag ${v.flag}`}>{v.flag} FLAG</span></td></tr><tr><td>Final Valuation</td><td><b>{inr(v.finalValuation)}</b></td><td>Status</td><td>{v.status}</td></tr></tbody></table><p className="muted">{(v.varianceReasons || []).join('; ')}</p></div>}
    {job.analysis && user.role !== 'LOAN_SEEKER' && <details><summary><b>AI Damage & Fraud (killfake.ai)</b></summary><p>Damage total: {inr(job.analysis.damage.costBreakdown.totalDamageCost)} (Parts {inr(job.analysis.damage.costBreakdown.parts)} · Labor {inr(job.analysis.damage.costBreakdown.labor)} · Paint {inr(job.analysis.damage.costBreakdown.paint)}) · Tire wear {job.analysis.damage.tireWearPct}% · Fraud: <b>{job.analysis.fraud.riskLevel} ({job.analysis.fraud.fraudScore}/100)</b></p><table><tbody>{job.analysis.fraud.checks.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.status}</td><td>{c.detail}</td></tr>)}</tbody></table></details>}
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      {user.role === 'INSPECTOR' && job.status === 'BROADCAST' && <button onClick={() => act(`/jobs/${job.id}/accept`)}>Accept Job (exclusive)</button>}
      {user.role === 'INSPECTOR' && job.status === 'ASSIGNED' && <button onClick={() => act(`/jobs/${job.id}/start`)}>Start Inspection</button>}
      {v?.finalValuation && <a className="btn ghost" href={`/api/jobs/${job.id}/report`} target="_blank" rel="noreferrer">View {user.role === 'LOAN_SEEKER' ? 'Summary' : 'Full'} Report</a>}
      {v?.finalValuation && <a className="btn ghost" href={`/api/jobs/${job.id}/report.pdf`} target="_blank" rel="noreferrer">Download PDF</a>}
      {(user.role === 'BANK' || user.role === 'ADMIN') && job.status === 'REPORT_DELIVERED' && <button className="green" onClick={() => act(`/jobs/${job.id}/settle`)}>Settle Payment (Phase 6)</button>}
    </div>
    {user.role === 'INSPECTOR' && ['ASSIGNED', 'INSPECTION_IN_PROGRESS'].includes(job.status) && <InspectionForm job={job} reload={reload} />}
    {user.role === 'ADMIN' && job.status === 'AUDIT_REQUIRED' && <AuditBox job={job} reload={reload} />}
    {(user.role === 'LOAN_SEEKER') && job.status === 'REPORT_DELIVERED' && !job.rating && <RateBox job={job} reload={reload} />}
    {job.rating && <p className="ok">Rating: Seeker {job.rating.seekerScore}/5 · Platform {job.rating.platformScore}/5 · <b>Composite {job.rating.composite}/5</b> (0.4×Seeker + 0.6×Platform)</p>}
    {user.role !== 'LOAN_SEEKER' && job.ledger?.length > 0 && <details><summary><b>Payments & Ledger</b></summary><table><tbody>{job.ledger.map((l) => <tr key={l.id}><td>{l.type}</td><td>{l.fromParty} → {l.toParty}</td><td>{inr(l.amount)}</td><td>{l.status}</td></tr>)}</tbody></table></details>}
  </div>;
}

function InspectionForm({ job, reload }) {
  const cats = ['FRONT', 'REAR', 'ENGINE', 'TIRE', 'ODOMETER'];
  const [f, setF] = useState({ odometerReading: job.expectedOdometer || 45000, manualValuation: '', manualRepairEstimate: 5000, notes: 'Vehicle in good condition' });
  const [damages, setDamages] = useState([{ part: 'Front bumper/panel', type: 'scratch', severity: 'Small', description: 'Minor scratch' }]);
  const [images, setImages] = useState(cats.map((category, i) => ({ category, lat: job.vehicleLat, lng: job.vehicleLng, capturedAt: new Date().toISOString(), imageHash: `img-${job.id}-${i}-${Math.random().toString(36).slice(2, 8)}` })));
  const [err, setErr] = useState('');
  const upload = async (e, idx) => { const file = e.target.files[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); fd.append('category', images[idx].category); fd.append('lat', images[idx].lat); fd.append('lng', images[idx].lng);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd }); const d = await res.json(); if (!res.ok) return setErr(d.error || 'Upload failed');
    setImages(images.map((im, i) => i === idx ? { ...im, imageHash: d.imageHash, filename: d.filename, originalName: d.originalName } : im)); };
  return <div style={{ marginTop: 14 }}><h3>On-Site Inspection (Phase 2)</h3>{err && <div className="err">{err}</div>}
    <div className="row"><div><label>Odometer reading (km)</label><input type="number" value={f.odometerReading} onChange={(e) => setF({ ...f, odometerReading: Number(e.target.value) })} /></div><div><label>Your manual valuation (₹)</label><input type="number" value={f.manualValuation} onChange={(e) => setF({ ...f, manualValuation: e.target.value })} placeholder="e.g. 735000" /></div></div>
    <div className="row"><div><label>Manual repair estimate (₹)</label><input type="number" value={f.manualRepairEstimate} onChange={(e) => setF({ ...f, manualRepairEstimate: Number(e.target.value) })} /></div><div><label>Notes</label><input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div></div>
    <label>Geotagged photos — upload real photos or keep simulated metadata (category · lat · lng · time · hash used by killfake checks)</label>
    {images.map((im, i) => <div key={i} className="row"><div><span className="pill">{im.category}</span> <span className="muted">{im.lat}, {im.lng} · {fmtDate(im.capturedAt)}</span></div><div><input type="file" accept="image/*,.pdf" onChange={(e) => upload(e, i)} /></div></div>)}
    <label>Observed damages</label>{damages.map((d, i) => <div key={i} className="row"><input value={d.part} onChange={(e) => setDamages(damages.map((x, j) => j === i ? { ...x, part: e.target.value } : x))} /><select value={d.severity} onChange={(e) => setDamages(damages.map((x, j) => j === i ? { ...x, severity: e.target.value } : x))}><option>Small</option><option>Medium</option><option>Large</option></select></div>)}
    <button className="ghost" onClick={() => setDamages([...damages, { part: '', type: 'dent', severity: 'Medium', description: '' }])}>+ Add damage</button>{' '}
    <button onClick={async () => { try { await api(`/jobs/${job.id}/inspection`, { method: 'POST', body: JSON.stringify({ ...f, manualValuation: Number(f.manualValuation), condition: { engine: 4, body: 4, tires: 3, interior: 4 }, damages, images, documents: [{ type: 'RC' }, { type: 'INSURANCE' }, { type: 'POLLUTION' }] }) }); reload(); } catch (e) { setErr(e.message); } }}>Submit Inspection · Get Instant Pay + Run AI</button>
    <p className="muted">On submit: ₹1,200 instant payment posts, AI damage/fraud runs, dual valuation & Red/Green flag are computed automatically.</p></div>;
}
function AuditBox({ job, reload }) {
  const [finalValuation, setFinal] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  const send = async (action) => { try { await api(`/jobs/${job.id}/audit`, { method: 'POST', body: JSON.stringify({ action, finalValuation: finalValuation ? Number(finalValuation) : undefined, note }) }); reload(); } catch (e) { setErr(e.message); } };
  return <div style={{ marginTop: 14 }}><h3>🔴 Red Flag Audit (Admin)</h3>{err && <div className="err">{err}</div>}<label>Senior-approved final valuation (₹, blank = average)</label><input type="number" value={finalValuation} onChange={(e) => setFinal(e.target.value)} /><label>Audit note</label><input value={note} onChange={(e) => setNote(e.target.value)} />
    <div style={{ display: 'flex', gap: 8 }}><button className="green" onClick={() => send('APPROVE')}>Approve</button><button onClick={() => send('SENIOR_REVIEW')}>Senior Review Approve</button><button className="danger" onClick={() => send('RE_INSPECTION')}>Order Re-inspection</button></div></div>;
}
function RateBox({ job, reload }) {
  const [r, setR] = useState({ professionalism: 5, punctuality: 5, communication: 5, thoroughness: 5, feedback: '' }); const [err, setErr] = useState('');
  return <div style={{ marginTop: 14 }}><h3>Rate your inspector</h3>{err && <div className="err">{err}</div>}
    {['professionalism', 'punctuality', 'communication', 'thoroughness'].map((k) => <div key={k}><label>{k} (1–5): {r[k]}</label><input type="range" min="1" max="5" value={r[k]} onChange={(e) => setR({ ...r, [k]: Number(e.target.value) })} /></div>)}
    <label>Feedback</label><input value={r.feedback} onChange={(e) => setR({ ...r, feedback: e.target.value })} />
    <button onClick={async () => { try { await api(`/jobs/${job.id}/rate`, { method: 'POST', body: JSON.stringify(r) }); reload(); } catch (e) { setErr(e.message); } }}>Submit Rating</button></div>;
}

function Dashboard() {
  const user = sessionUser(); const nav = useNavigate(); const [jobs, setJobs] = useState([]); const [sel, setSel] = useState(null); const [overview, setOverview] = useState(null); const [inspectors, setInspectors] = useState([]); const [ledger, setLedger] = useState([]); const [notifs, setNotifs] = useState([]); const [tab, setTab] = useState('jobs'); const [err, setErr] = useState('');
  const [jobForm, setJobForm] = useState({ seekerName: 'Demo Loan Seeker', seekerPhone: '+919000000006', seekerEmail: 'seeker@valuation.techno', loanRef: 'LOAN-1001', regNumber: 'TN38AB1234', make: 'Hyundai', model: 'Creta', variant: 'SX', year: 2020, fuel: 'Petrol', vehicleLat: 11.0168, vehicleLng: 76.9558, city: 'Coimbatore', expectedOdometer: 45000, valuationFee: 2500 });
  const reload = async () => { try { const j = await api('/jobs'); setJobs(j); if (sel) setSel(j.find((x) => x.id === sel.id) || null);
    if (user.role === 'ADMIN' || user.role === 'BANK') { setOverview(await api('/admin/overview')); setLedger(await api('/admin/ledger')); if (user.role === 'ADMIN') setInspectors(await api('/admin/inspectors')); }
    if (user.role === 'INSPECTOR') setLedger(await api('/admin/ledger')); setNotifs(await api('/admin/notifications')); } catch (e) { setErr(e.message); } };
  useEffect(() => { reload(); }, []);
  if (!user) return <Navigate to="/" />;
  const earnings = ledger.filter((l) => ['INSPECTOR_INSTANT_PAY', 'INSPECTOR_BONUS'].includes(l.type)).reduce((s, l) => s + l.amount, 0);
  return <div><header className="topbar"><div><div className="brand">Valuation <span>Techno</span></div><div className="tag">Smart Valuation. Safer Transactions.</div></div><div>{user.name} · {user.role}<br /><button className="ghost" onClick={() => { clearSession(); nav('/'); }}>Logout</button></div></header>
  <div className="wrap">{err && <div className="err">{err}</div>}
    <div className="grid"><div className="card"><div className="muted">Jobs visible</div><div className="stat">{jobs.length}</div></div>
      {overview && <><div className="card"><div className="muted">Audit required (RED)</div><div className="stat">{overview.auditRequired}</div></div><div className="card"><div className="muted">Reports delivered</div><div className="stat">{overview.delivered}</div></div><div className="card"><div className="muted">Settled value</div><div className="stat">{inr(overview.ledgerTotal)}</div></div></>}
      {user.role === 'INSPECTOR' && <div className="card"><div className="muted">My earnings (instant pay + bonus)</div><div className="stat">{inr(earnings)}</div><div className="muted">Rating: ★ {user.rating}</div></div>}
      <div className="card"><div className="muted">Notifications</div><div className="stat">{notifs.length}</div><div className="muted">{notifs[0]?.title || 'No notifications'}</div></div></div>

    {user.role === 'BANK' && <div className="card"><h2>Phase 1 — Create Valuation Job</h2><div className="row"><div><label>Loan seeker name</label><input value={jobForm.seekerName} onChange={(e) => setJobForm({ ...jobForm, seekerName: e.target.value })} /></div><div><label>Registration number</label><input value={jobForm.regNumber} onChange={(e) => setJobForm({ ...jobForm, regNumber: e.target.value })} /></div></div>
      <div className="row"><div><label>Make</label><input value={jobForm.make} onChange={(e) => setJobForm({ ...jobForm, make: e.target.value })} /></div><div><label>Model</label><input value={jobForm.model} onChange={(e) => setJobForm({ ...jobForm, model: e.target.value })} /></div></div>
      <div className="row"><div><label>Year</label><input type="number" value={jobForm.year} onChange={(e) => setJobForm({ ...jobForm, year: Number(e.target.value) })} /></div><div><label>Vehicle GPS (lat, lng)</label><input value={`${jobForm.vehicleLat}, ${jobForm.vehicleLng}`} onChange={(e) => { const [a, b] = e.target.value.split(',').map(Number); setJobForm({ ...jobForm, vehicleLat: a, vehicleLng: b }); }} /></div></div>
      <button onClick={async () => { try { const j = await api('/jobs', { method: 'POST', body: JSON.stringify(jobForm) }); setSel(j); reload(); } catch (e) { setErr(e.message); } }}>Verify Vehicle + Broadcast to Inspectors</button>
      <p className="muted">Try plates: TN38AB1234 (Hyundai Creta pricing) · any valid Indian format works. Creation auto-runs VAHAN/IIB verification & radius broadcast.</p></div>}

    {user.role === 'ADMIN' && <div className="card"><h2>Platform Controls</h2><p className="muted">Allocation mode: <b>{overview?.allocationMode}</b> · Radius: {overview?.radiusKm} km</p>
      <div style={{ display: 'flex', gap: 8 }}><button onClick={async () => { await api('/admin/settings', { method: 'PATCH', body: JSON.stringify({ allocationMode: 'FIRST_COME' }) }); reload(); }}>First-Come Mode</button><button onClick={async () => { await api('/admin/settings', { method: 'PATCH', body: JSON.stringify({ allocationMode: 'RATING_PRIORITY' }) }); reload(); }}>Rating-Priority Mode</button></div>
      <h3>Inspectors</h3><table><thead><tr><th>Name</th><th>Rating</th><th>Jobs rated</th><th>Status</th><th>Action</th></tr></thead><tbody>{inspectors.map((i) => <tr key={i.id}><td>{i.name}<br /><span className="muted">{i.email}</span></td><td>★ {i.rating}</td><td>{i.ratingCount}</td><td>{i.status}</td><td>{['ACTIVE', 'RETRAINING', 'SUSPENDED'].map((s) => <button key={s} className="ghost" onClick={async () => { await api(`/admin/inspectors/${i.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) }); reload(); }}>{s}</button>)}</td></tr>)}</tbody></table></div>}

    <div className="tabs"><button className={tab === 'jobs' ? 'on' : ''} onClick={() => setTab('jobs')}>Jobs ({jobs.length})</button>{user.role !== 'LOAN_SEEKER' && <button className={tab === 'ledger' ? 'on' : ''} onClick={() => setTab('ledger')}>Payments & Ledger</button>}<button className={tab === 'notifs' ? 'on' : ''} onClick={() => setTab('notifs')}>Notifications</button></div>
    {tab === 'jobs' && <div className="card"><table><thead><tr><th>Vehicle</th><th>Reg</th><th>Status</th><th>Valuation</th><th></th></tr></thead><tbody>{jobs.map((j) => <tr key={j.id}><td>{j.make} {j.model} ({j.year})<br /><span className="muted">{j.city || ''} · {fmtDate(j.createdAt)}</span></td><td>{j.regNumber}</td><td><StatusPill s={j.status} /></td><td>{j.valuation?.finalValuation ? inr(j.valuation.finalValuation) : j.valuation ? `${j.valuation.variancePct}% ${j.valuation.flag}` : '—'}</td><td><button className="ghost" onClick={() => setSel(j)}>Open</button></td></tr>)}</tbody></table>{jobs.length === 0 && <p className="muted">No jobs yet. {user.role === 'BANK' ? 'Create the first job above.' : 'Waiting for bank jobs in your radius.'}</p>}</div>}
    {tab === 'ledger' && <div className="card"><table><thead><tr><th>Type</th><th>From → To</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{ledger.map((l) => <tr key={l.id}><td>{l.type}</td><td>{l.fromParty} → {l.toParty}</td><td>{inr(l.amount)}</td><td>{l.status}</td><td>{fmtDate(l.createdAt)}</td></tr>)}</tbody></table></div>}
    {tab === 'notifs' && <div className="card">{notifs.map((n) => <p key={n.id}><b>{n.title}</b><br /><span className="muted">{n.body} · {fmtDate(n.createdAt)}</span></p>)}</div>}
    {sel && <JobDetail job={sel} user={user} reload={reload} />}
  </div></div>;
}
export default function App() { return <Routes><Route path="/" element={token() ? <Navigate to="/dashboard" /> : <Login />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="*" element={<Navigate to="/" />} /></Routes>; }
