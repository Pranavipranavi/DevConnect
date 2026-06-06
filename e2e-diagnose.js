import fs from 'node:fs/promises';
import { chromium } from './node_modules/playwright/index.mjs';

const out = 'D:/Codtech/Auth of Full Stack/test-results/diagnostics';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
const responses = [];
page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: err.message }));
page.on('response', (response) => {
  if (response.status() >= 400) responses.push({ status: response.status(), url: response.url() });
});
await page.goto('http://127.0.0.1:5173/register', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${out}/register.png`, fullPage: true });
const snapshot = await page.locator('body').innerText().catch((error) => error.message);
const inputs = await page.locator('input').evaluateAll((items) => items.map((input) => ({
  type: input.type,
  placeholder: input.placeholder,
  value: input.value,
  id: input.id,
  name: input.name,
  aria: input.getAttribute('aria-label')
}))).catch((error) => [{ error: error.message }]);
await fs.writeFile(`${out}/register-diagnostics.json`, JSON.stringify({ url: page.url(), title: await page.title(), snapshot, inputs, logs, responses }, null, 2));
console.log(JSON.stringify({ url: page.url(), title: await page.title(), snapshot: snapshot.slice(0, 500), inputs, logs, responses }, null, 2));
await browser.close();
