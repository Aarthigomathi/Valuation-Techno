const BASE = '/api';
export const token = () => localStorage.getItem('vt_token');
export const sessionUser = () => { try { return JSON.parse(localStorage.getItem('vt_user')); } catch { return null; } };
export function setSession(t, u) { localStorage.setItem('vt_token', t); localStorage.setItem('vt_user', JSON.stringify(u)); }
export function clearSession() { localStorage.removeItem('vt_token'); localStorage.removeItem('vt_user'); }
export async function api(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(opts.headers || {}) } });
  const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}
// Open an authenticated file (report HTML / PDF) — a plain <a href> cannot send the JWT, so fetch as blob first.
export async function openAuthed(path) {
  const w = window.open('about:blank', '_blank');
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token()}` } });
  if (!res.ok) { const t = await res.text(); if (w) w.close(); throw new Error(t.slice(0, 200) || `Failed (${res.status})`); }
  const blob = await res.blob(); const url = URL.createObjectURL(blob);
  if (w) w.location = url; else { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export const inr = (n) => n === null || n === undefined ? '—' : '₹' + Number(n).toLocaleString('en-IN');
export const fmtDate = (s) => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
