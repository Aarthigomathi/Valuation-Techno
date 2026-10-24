import http from 'node:http';
import app from './app.js';
import { config } from './config.js';
import { attachRealtime } from './realtime.js';
const server = http.createServer(app);
attachRealtime(server); // WebSocket live layer on /ws (same port — single-service deployment)
server.listen(config.port, '0.0.0.0', () => console.log(`\n✅ Valuation Techno STARTED!\n👉 Browser-la indha address open pannunga: http://localhost:${config.port}\n   (0.0.0.0 address-a click pannaatha — adhu browser-la open aagadhu)\n`));
