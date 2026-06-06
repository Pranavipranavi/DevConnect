import fs from 'node:fs/promises';
import { chromium } from './node_modules/playwright/index.mjs';

const OUT = 'D:/Codtech/Auth of Full Stack/test-results/comments-focused';
const API = 'http://127.0.0.1:5000/api';
const BASE = 'http://localhost:5173';
await fs.mkdir(OUT, { recursive: true });

const stamp = Date.now();
const result = { startedAt: new Date().toISOString(), console: [], networkFailures: {}, tests: {} };
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('console', (msg) => result.console.push({ type: msg.type(), text: msg.text() }));
page.on('requestfailed', (request) => result.networkFailures[request.url()] = request.failure()?.errorText);

const api = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : {} };
};
const record = (name, pass, detail) => result.tests[name] = { status: pass ? 'PASS' : 'FAIL', detail };

const userRes = await api(`${API}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Comment Focus User', email: `comments-${stamp}@devconnect.test`, password: 'Password123!' })
});
const headers = { Authorization: `Bearer ${userRes.body.token}` };
const postRes = await api(`${API}/posts`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: `Comment Focus Post ${stamp}`,
    content: 'This post exists only to verify comment and reply UI behavior with a stable ID route.',
    category: 'Testing',
    tags: 'comments,ui,e2e',
    status: 'published'
  })
});

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.getByLabel('Email').fill(`comments-${stamp}@devconnect.test`);
await page.getByLabel('Password').fill('Password123!');
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/dashboard', { timeout: 15000 });
await page.goto(`${BASE}/blogs/${postRes.body.post._id}`, { waitUntil: 'networkidle' });

try {
  await page.getByLabel('Add to the discussion').fill('Focused root comment visible in UI.');
  await page.getByRole('button', { name: 'Submit comment' }).click();
  await page.waitForTimeout(1000);
  record('add_comment_ui', await page.getByText('Focused root comment visible in UI.').isVisible(), 'root comment visible');
} catch (error) {
  record('add_comment_ui', false, error.message);
}

try {
  await page.getByRole('button', { name: 'Reply' }).first().click();
  await page.getByLabel('Write a reply').fill('Focused reply visible in UI.');
  await page.getByRole('button', { name: 'Submit reply' }).click();
  await page.waitForTimeout(1000);
  record('add_reply_ui', await page.getByText('Focused reply visible in UI.').isVisible(), 'reply visible');
} catch (error) {
  record('add_reply_ui', false, error.message);
}

const before = await api(`${API}/comments/${postRes.body.post._id}`);
const root = before.body.comments.find((comment) => comment.comment === 'Focused root comment visible in UI.');
if (root) await api(`${API}/comments/${root._id}`, { method: 'DELETE', headers });
const after = await api(`${API}/comments/${postRes.body.post._id}`);
record('delete_comment_db', Boolean(root) && !after.body.comments.some((comment) => comment._id === root._id), `before=${before.body.comments.length}, after=${after.body.comments.length}`);
await page.screenshot({ path: `${OUT}/comments-focused.png`, fullPage: true });
await fs.writeFile(`${OUT}/comments-focused.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
