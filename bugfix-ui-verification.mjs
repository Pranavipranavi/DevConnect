import fs from 'fs/promises';
import { chromium } from 'playwright';

const appUrl = 'http://localhost:5173';
const stamp = Date.now();
const email = `ui-qa-${stamp}@example.com`;
const password = 'Password123!';
const screenshotsDir = 'D:/Codtech/Auth of Full Stack/test-artifacts';
const results = [];
const consoleIssues = [];
const failedRequests = [];

const record = (name, pass, details = {}) => {
  results.push({ name, pass: Boolean(pass), ...details });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`, details);
};

await fs.mkdir(screenshotsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) {
    consoleIssues.push({ type: message.type(), text: message.text() });
  }
});

page.on('requestfailed', (request) => {
  const url = request.url();
  if ((url.includes('127.0.0.1') || url.includes('localhost')) && !url.includes('/node_modules/.vite/')) {
    failedRequests.push({ url, failure: request.failure()?.errorText });
  }
});

try {
  await page.goto(`${appUrl}/register`, { waitUntil: 'networkidle' });
  await page.getByLabel('Name').fill('UI QA User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForSelector('text=Logout', { timeout: 15000 });
  await page.screenshot({ path: `${screenshotsDir}/ui-auth-dashboard.png`, fullPage: true });
  const tokenAfterRegister = await page.evaluate(() => localStorage.getItem('devconnect_token'));
  record('UI register redirects to dashboard and updates navbar', page.url().endsWith('/dashboard') && Boolean(tokenAfterRegister), {
    url: page.url(),
    tokenPresent: Boolean(tokenAfterRegister)
  });

  await page.reload({ waitUntil: 'networkidle' });
  const logoutVisibleAfterRefresh = await page.getByRole('button', { name: 'Logout' }).isVisible();
  record('Refresh after login preserves session and navbar state', logoutVisibleAfterRefresh, {
    url: page.url()
  });

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${screenshotsDir}/ui-after-logout.png`, fullPage: true });
  const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('devconnect_token'));
  const loginVisible = await page.getByRole('link', { name: 'Login' }).isVisible().catch(() => false);
  record('UI logout clears token, redirects home, and updates navbar', page.url() === `${appUrl}/` && !tokenAfterLogout && loginVisible, {
    url: page.url(),
    pathname: new URL(page.url()).pathname,
    tokenPresent: Boolean(tokenAfterLogout),
    loginVisible
  });

  await page.reload({ waitUntil: 'networkidle' });
  const tokenAfterLogoutRefresh = await page.evaluate(() => localStorage.getItem('devconnect_token'));
  const loginVisibleAfterLogoutRefresh = await page.getByRole('link', { name: 'Login' }).isVisible();
  record('Refresh after logout does not restore session', !tokenAfterLogoutRefresh && loginVisibleAfterLogoutRefresh, {
    tokenPresent: Boolean(tokenAfterLogoutRefresh)
  });

  await page.goto(`${appUrl}/register`, { waitUntil: 'networkidle' });
  await page.getByLabel('Name').fill('UI QA Duplicate');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForSelector('text=An account with this email already exists. Please login.', { timeout: 15000 });
  record('UI duplicate registration shows friendly message', true, {
    message: 'An account with this email already exists. Please login.'
  });

  await page.goto(`${appUrl}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForSelector('text=Logout', { timeout: 15000 });
  record('UI login again updates auth state', page.url().endsWith('/dashboard'), { url: page.url() });

  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Sample Data/i }).click();
  await page.waitForSelector('text=/Sample data (generated successfully|already exists)/', { timeout: 60000 });
  await page.screenshot({ path: `${screenshotsDir}/ui-sample-data-toast.png`, fullPage: true });
  record('UI Sample Data button shows friendly success/already-exists toast', true);

  record('No local failed network requests during UI run', failedRequests.length === 0, { failedRequests });
  record('No browser console errors during UI run', consoleIssues.filter((item) => item.type === 'error').length === 0, { consoleIssues });
} catch (error) {
  record('UI verification runner crashed', false, { message: error.message, stack: error.stack });
} finally {
  await browser.close();
  const failed = results.filter((item) => !item.pass);
  console.log(JSON.stringify({ email, screenshotsDir, passed: results.length - failed.length, failed: failed.length, results, consoleIssues, failedRequests }, null, 2));
  if (failed.length) process.exit(1);
}
