import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { seed } from './db.js';
import { config } from './config.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';

seed();
const app = express();
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); res.setHeader('Referrer-Policy', 'no-referrer'); next(); });
app.use(cors({ origin: process.env.CORS_ORIGIN || true })); app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(config.uploadDir));
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Valuation Techno API', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes); app.use('/api/jobs', jobRoutes); app.use('/api/admin', adminRoutes); app.use('/api', analyticsRoutes);
// Mobile App Layer: file upload with geo/time metadata + content hash for killfake duplicate checks
const upload = multer({ dest: config.uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });
app.post('/api/upload', requireAuth, requireRole('INSPECTOR', 'BANK'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: file)' });
  const hash = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');
  res.status(201).json({ filename: req.file.filename, originalName: req.file.originalname, url: `/uploads/${req.file.filename}`, imageHash: hash, category: req.body.category || 'DAMAGE', lat: req.body.lat ? Number(req.body.lat) : undefined, lng: req.body.lng ? Number(req.body.lng) : undefined, capturedAt: req.body.capturedAt || new Date().toISOString() });
});
// Serve built frontend when present (single-port demo)
const webDist = new URL('../../web/dist/', import.meta.url).pathname;
if (fs.existsSync(webDist)) { app.use(express.static(webDist)); app.get('*', (req, res, next) => req.path.startsWith('/api') ? next() : res.sendFile(path.join(webDist, 'index.html'))); }
app.use((err, req, res, next) => { console.error(err); if (err?.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors }); res.status(err.status || 500).json({ error: err.message || 'Internal server error' }); });
export default app;
