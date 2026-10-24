import { Router } from 'express';
import { z } from 'zod';
import { db, settings, audit, publicUser } from '../db.js';
import { requireAuth, requireRole, wrap } from '../middleware/auth.js';
const r = Router(); r.use(requireAuth);
r.get('/overview', requireRole('ADMIN', 'BANK'), wrap(async (req, res) => {
  const c = (q) => db.prepare(q).get().c;
  res.json({ jobsTotal: c('SELECT COUNT(*) c FROM jobs'), broadcast: c("SELECT COUNT(*) c FROM jobs WHERE status='BROADCAST'"), auditRequired: c("SELECT COUNT(*) c FROM jobs WHERE status='AUDIT_REQUIRED'"), delivered: c("SELECT COUNT(*) c FROM jobs WHERE status IN ('REPORT_DELIVERED','SETTLED')"), settled: c("SELECT COUNT(*) c FROM jobs WHERE status='SETTLED'"), redFlags: c("SELECT COUNT(*) c FROM valuations WHERE flag='RED'"), greenFlags: c("SELECT COUNT(*) c FROM valuations WHERE flag='GREEN'"), ledgerTotal: db.prepare("SELECT COALESCE(SUM(amount),0) s FROM ledger WHERE type='BANK_TO_PLATFORM'").get().s, allocationMode: settings.allocationMode, radiusKm: settings.radiusKm });
}));
r.get('/inspectors', requireRole('ADMIN', 'BANK'), wrap(async (req, res) => res.json(db.prepare("SELECT * FROM users WHERE role='INSPECTOR' ORDER BY rating DESC").all().map(publicUser))));
r.patch('/inspectors/:id/status', requireRole('ADMIN'), wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(['ACTIVE', 'RETRAINING', 'SUSPENDED']) }).parse(req.body);
  db.prepare('UPDATE users SET status=? WHERE id=?').run(status, req.params.id); audit(null, req.user.id, 'INSPECTOR_STATUS_' + status, req.params.id);
  res.json({ ok: true });
}));
r.patch('/settings', requireRole('ADMIN'), wrap(async (req, res) => {
  const b = z.object({ allocationMode: z.enum(['FIRST_COME', 'RATING_PRIORITY']).optional(), radiusKm: z.number().positive().max(200).optional() }).parse(req.body);
  if (b.allocationMode) settings.set('allocationMode', b.allocationMode); if (b.radiusKm) settings.set('radiusKm', b.radiusKm);
  audit(null, req.user.id, 'SETTINGS_UPDATED', JSON.stringify(b)); res.json({ allocationMode: settings.allocationMode, radiusKm: settings.radiusKm });
}));
r.get('/audit-log', requireRole('ADMIN'), wrap(async (req, res) => res.json(db.prepare('SELECT * FROM audit_log ORDER BY createdAt DESC LIMIT 200').all())));
r.get('/ledger', requireAuth, wrap(async (req, res) => {
  if (req.user.role === 'INSPECTOR') return res.json(db.prepare('SELECT * FROM ledger WHERE userId=? ORDER BY createdAt DESC').all(req.user.id));
  if (req.user.role === 'LOAN_SEEKER') return res.status(403).json({ error: 'Ledger not available for loan seekers' });
  res.json(db.prepare('SELECT * FROM ledger ORDER BY createdAt DESC LIMIT 300').all());
}));
r.get('/notifications', requireAuth, wrap(async (req, res) => res.json(db.prepare('SELECT * FROM notifications WHERE userId=? OR userId IS NULL ORDER BY createdAt DESC LIMIT 50').all(req.user.id))));
export default r;
