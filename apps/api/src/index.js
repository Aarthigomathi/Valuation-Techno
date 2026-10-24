import http from 'node:http';
import app from './app.js';
import { config } from './config.js';
import { attachRealtime } from './realtime.js';
const server = http.createServer(app);
attachRealtime(server); // WebSocket live layer on /ws (same port — single-service deployment)
server.listen(config.port, '0.0.0.0', () => console.log(`Valuation Techno API + Realtime listening on http://0.0.0.0:${config.port}`));
