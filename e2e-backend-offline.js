import fs from 'node:fs/promises';
import { chromium } from './node_modules/playwright/index.mjs';

const OUT = 'D:/Codtech/Auth of Full Stack/test-results/backend-offline';
await fs.mkdir(OUT, { recursive: true });
const result = { startedAt: new Date().toISOString(), console: [], networkFailures: [], visibleText: '' };
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (msg) => result.console.push({ type: msg.type(), text: msg.text() }));
page.on('requestfailed', (request) => result.networkFailures.push({ url: request.url(), failure: request.failure()?.errorText }));
await page.goto('http://localhost:5173/search', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
result.visibleText = await page.locator('body').innerText();
result.hasFriendlyError = result.visibleText.includes('API server is not reachable') || result.visibleText.includes('Request failed');
await page.screenshot({ path: `${OUT}/backend-offline-search.png`, fullPage: true });
await fs.writeFile(`${OUT}/backend-offline.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
