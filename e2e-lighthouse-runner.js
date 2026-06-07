import fs from 'node:fs/promises';
import path from 'node:path';
import lighthouse from './node_modules/lighthouse/core/index.js';
import * as chromeLauncher from './node_modules/chrome-launcher/dist/index.js';

const ROOT = 'D:/Codtech/Auth of Full Stack';
const OUT = path.join(ROOT, 'test-results', `lighthouse-${Date.now()}`);
const API_ORIGIN = 'http://localhost:5000';
const APP_ORIGIN = 'http://localhost:4173';

process.env.PORT = '5000';
process.env.CLIENT_URL = APP_ORIGIN;
process.env.API_PUBLIC_URL = API_ORIGIN;

const dotenv = await import('./server/node_modules/dotenv/lib/main.js');
dotenv.config({ path: path.join(ROOT, 'server', '.env') });

const { default: connectDB } = await import('./server/config/db.js');
const { default: app } = await import('./server/app.js');
const mongoose = await import('./server/node_modules/mongoose/index.js');
const { preview } = await import('./client/node_modules/vite/dist/node/index.js');

await fs.mkdir(OUT, { recursive: true });
await connectDB();
const apiServer = await new Promise((resolve) => {
  const server = app.listen(5000, '127.0.0.1', () => resolve(server));
});
const previewServer = await preview({
  root: path.join(ROOT, 'client'),
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  logLevel: 'silent'
});

const closeHttpServer = async (server) => {
  await Promise.race([
    new Promise((resolve) => server.close(resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]);
};

const chrome = await chromeLauncher.launch({
  chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
});

try {
  const runnerResult = await lighthouse(APP_ORIGIN, {
    port: chrome.port,
    output: 'json',
    logLevel: 'silent',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
  });
  const report = JSON.parse(runnerResult.report);
  const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
  await fs.writeFile(path.join(OUT, 'lighthouse.json'), runnerResult.report);
  await fs.writeFile(path.join(OUT, 'scores.json'), JSON.stringify(scores, null, 2));
  console.log(JSON.stringify({ out: OUT, scores }, null, 2));
} finally {
  try {
    await chrome.kill();
  } catch {}
  await closeHttpServer(previewServer.httpServer);
  await closeHttpServer(apiServer);
  await mongoose.default.disconnect().catch(() => {});
  process.exit(0);
}
