import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from './node_modules/playwright/index.mjs';

const ROOT = 'D:/Codtech/Auth of Full Stack';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const API = 'http://127.0.0.1:5000/api';
const stamp = Date.now();
const OUT = `${ROOT}/test-results/e2e-${stamp}`;

process.env.PORT = '5000';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.API_PUBLIC_URL = 'http://127.0.0.1:5000';
process.env.VITE_API_URL = API;

const dotenv = await import('./server/node_modules/dotenv/lib/main.js');
dotenv.config({ path: path.join(ROOT, 'server', '.env') });

const { default: connectDB } = await import('./server/config/db.js');
const { default: app } = await import('./server/app.js');
const mongoose = await import('./server/node_modules/mongoose/index.js');
const { createServer: createViteServer } = await import('./client/node_modules/vite/dist/node/index.js');
process.chdir(path.join(ROOT, 'client'));

const result = {
  startedAt: new Date().toISOString(),
  screenshots: [],
  console: [],
  networkFailures: [],
  auth: {},
  blog: {},
  comments: {},
  likes: {},
  bookmarks: {},
  search: {},
  profile: {},
  admin: {},
  responsive: {},
  errors: {}
};

const safe = (name) => name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
const shot = async (page, name, fullPage = true) => {
  const file = path.join(OUT, `${safe(name)}.png`);
  await page.screenshot({ path: file, fullPage });
  result.screenshots.push(file);
  return file;
};

const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { response, body };
};

const record = (group, name, pass, detail = '') => {
  result[group][name] = { status: pass ? 'PASS' : 'FAIL', detail };
};

await fs.mkdir(OUT, { recursive: true });
for (let i = 1; i <= 5; i += 1) {
  await fs.writeFile(path.join(OUT, `cover-${i}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#38BDF8"/><text x="80" y="330" font-size="72" font-family="Arial" fill="#0F172A">DevConnect E2E ${i}</text></svg>`);
}
await fs.writeFile(path.join(OUT, 'invalid-upload.txt'), 'not an image');

await connectDB();
const apiServer = await new Promise((resolve) => {
  const server = app.listen(5000, '127.0.0.1', () => resolve(server));
});
const viteServer = await createViteServer({
  root: path.join(ROOT, 'client'),
  envDir: path.join(ROOT, 'client'),
  logLevel: 'silent',
  server: { host: '127.0.0.1', port: 5173, strictPort: true }
});
await viteServer.listen();

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.on('console', (message) => result.console.push({ type: message.type(), text: message.text() }));
page.on('requestfailed', (request) => result.networkFailures.push({ url: request.url(), failure: request.failure()?.errorText }));

const user = {
  name: `E2E User ${stamp}`,
  email: `e2e-${stamp}@devconnect.test`,
  password: 'Password123!'
};

try {
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  record('auth', 'register_new_account', true, `registered ${user.email}`);
  await shot(page, 'auth-register-dashboard');
} catch (error) {
  record('auth', 'register_new_account', false, error.message);
}

try {
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForTimeout(500);
  record('auth', 'logout', !await page.getByText('Logout').isVisible().catch(() => false), 'logout button no longer visible');
} catch (error) {
  record('auth', 'logout', false, error.message);
}

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  record('auth', 'login', true, 'logged in after logout');
} catch (error) {
  record('auth', 'login', false, error.message);
}

try {
  await page.reload({ waitUntil: 'networkidle' });
  record('auth', 'refresh_after_login', page.url().includes('/dashboard'), page.url());
} catch (error) {
  record('auth', 'refresh_after_login', false, error.message);
}

try {
  await page.goto(`${BASE}/create`, { waitUntil: 'networkidle' });
  record('auth', 'protected_routes_access', page.url().includes('/create'), page.url());
} catch (error) {
  record('auth', 'protected_routes_access', false, error.message);
}

record('auth', 'google_login', false, 'VITE_GOOGLE_CLIENT_ID/GOOGLE_CLIENT_ID are empty; no Google button can complete OAuth.');

const createdPosts = [];
for (let i = 1; i <= 5; i += 1) {
  try {
    await page.goto(`${BASE}/create`, { waitUntil: 'networkidle' });
    await page.getByLabel('Title').fill(`E2E Production Blog ${i} ${stamp}`);
    await page.getByLabel('Category').fill(['React', 'Node.js', 'MongoDB', 'AI Tools', 'Cloud Computing'][i - 1]);
    await page.getByLabel('Tags').fill(['react,frontend,e2e', 'node,api,e2e', 'mongodb,database,e2e', 'ai,tools,e2e', 'cloud,deploy,e2e'][i - 1]);
    await page.locator('input[type="file"]').setInputFiles(path.join(OUT, `cover-${i}.svg`));
    await page.locator('.ql-editor').fill(`This is E2E blog post ${i}. It has enough real content to verify publishing, dashboard counters, searching, and persistence in MongoDB.`);
    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForURL('**/blogs/**', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await shot(page, `blog-created-${i}`, i === 1);
    createdPosts.push({ title: `E2E Production Blog ${i} ${stamp}`, url: page.url() });
    record('blog', `create_post_${i}`, true, page.url());
  } catch (error) {
    record('blog', `create_post_${i}`, false, error.message);
  }
}

const token = await page.evaluate(() => localStorage.getItem('devconnect_token'));
const authHeaders = { Authorization: `Bearer ${token}` };

const postsDb = [];
for (const created of createdPosts) {
  const slug = created.url.split('/').pop();
  const { response, body } = await apiFetch(`${API}/posts/${slug}`, { headers: authHeaders });
  postsDb.push(body.post);
  record('blog', `db_verify_${slug}`, response.ok && body.post?.title === created.title && Boolean(body.post?.coverImage), `coverImage=${body.post?.coverImage || ''}`);
}
result.blog.createdPostIds = postsDb.filter(Boolean).map((post) => post._id);

for (const post of postsDb.slice(0, 2)) {
  try {
    await page.goto(`${BASE}/edit/${post._id}`, { waitUntil: 'networkidle' });
    await page.getByLabel('Title').fill(`${post.title} Edited`);
    await page.locator('.ql-editor').fill(`Edited content for ${post.title}. This verifies the update flow from UI through the API and MongoDB.`);
    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForURL('**/blogs/**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    record('blog', `edit_${post._id}`, true, page.url());
  } catch (error) {
    record('blog', `edit_${post?._id || 'missing'}`, false, error.message);
  }
}

try {
  const deleteTarget = postsDb[4];
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await apiFetch(`${API}/posts/${deleteTarget._id}`, { method: 'DELETE', headers: authHeaders });
  const verifyDelete = await apiFetch(`${API}/posts/${deleteTarget._id}`, { headers: authHeaders });
  record('blog', 'delete_1_post', verifyDelete.response.status === 404, `status=${verifyDelete.response.status}`);
} catch (error) {
  record('blog', 'delete_1_post', false, error.message);
}

const target = postsDb[0];
try {
  await page.goto(`${BASE}/blogs/${target._id}`, { waitUntil: 'networkidle' });
  await page.getByLabel('Add to the discussion').fill('E2E root comment from browser.');
  await page.getByRole('button', { name: 'Submit comment' }).click();
  await page.waitForTimeout(1000);
  record('comments', 'add_comment_ui', await page.getByText('E2E root comment from browser.').isVisible(), 'root comment visible');
} catch (error) {
  record('comments', 'add_comment_ui', false, error.message);
}

try {
  await page.getByRole('button', { name: 'Reply' }).first().click();
  await page.getByLabel('Write a reply').fill('E2E reply from browser.');
  await page.getByRole('button', { name: 'Submit reply' }).click();
  await page.waitForTimeout(1000);
  record('comments', 'add_reply_ui', await page.getByText('E2E reply from browser.').isVisible(), 'reply visible');
} catch (error) {
  record('comments', 'add_reply_ui', false, error.message);
}

try {
  const before = (await apiFetch(`${API}/comments/${target._id}`)).body.comments;
  const own = before.find((comment) => comment.comment === 'E2E root comment from browser.');
  await apiFetch(`${API}/comments/${own._id}`, { method: 'DELETE', headers: authHeaders });
  const after = (await apiFetch(`${API}/comments/${target._id}`)).body.comments;
  record('comments', 'delete_comment_db', !after.some((comment) => comment._id === own._id), `before=${before.length}, after=${after.length}`);
} catch (error) {
  record('comments', 'delete_comment_db', false, error.message);
}

try {
  const like1 = await apiFetch(`${API}/likes/${target._id}`, { method: 'POST', headers: authHeaders });
  const like2 = await apiFetch(`${API}/likes/${target._id}`, { method: 'POST', headers: authHeaders });
  record('likes', 'like', like1.body.liked === true, `likes=${like1.body.likes}`);
  record('likes', 'unlike', like2.body.liked === false, `likes=${like2.body.likes}`);
} catch (error) {
  record('likes', 'like_unlike', false, error.message);
}

try {
  const bm1 = await apiFetch(`${API}/bookmarks/${target._id}`, { method: 'POST', headers: authHeaders });
  const dashboard1 = await apiFetch(`${API}/users/dashboard`, { headers: authHeaders });
  const bm2 = await apiFetch(`${API}/bookmarks/${target._id}`, { method: 'POST', headers: authHeaders });
  const dashboard2 = await apiFetch(`${API}/users/dashboard`, { headers: authHeaders });
  record('bookmarks', 'save_post', bm1.body.bookmarked === true && dashboard1.body.bookmarks.some((post) => post._id === target._id), `dashboardBookmarks=${dashboard1.body.bookmarks.length}`);
  record('bookmarks', 'remove_post', bm2.body.bookmarked === false && !dashboard2.body.bookmarks.some((post) => post._id === target._id), `dashboardBookmarks=${dashboard2.body.bookmarks.length}`);
} catch (error) {
  record('bookmarks', 'save_remove', false, error.message);
}

for (const term of ['React', 'Node', 'MongoDB', 'AI']) {
  try {
    await page.goto(`${BASE}/search?q=${encodeURIComponent(term)}`, { waitUntil: 'networkidle' });
    await shot(page, `search-${term}`, false);
    const apiResult = await apiFetch(`${API}/posts?search=${encodeURIComponent(term)}&limit=20`);
    const titles = apiResult.body.posts.map((post) => post.title);
    record('search', term, apiResult.response.ok && apiResult.body.posts.length > 0, `${apiResult.body.posts.length} results: ${titles.slice(0, 3).join(' | ')}`);
  } catch (error) {
    record('search', term, false, error.message);
  }
}

try {
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await page.getByLabel('Bio').fill(`Updated E2E bio ${stamp}`);
  await page.getByLabel('Linkedin').fill('https://www.linkedin.com/in/e2e');
  await page.getByLabel('Github').fill('https://github.com/e2e');
  await page.getByLabel('Twitter').fill('https://twitter.com/e2e');
  await page.getByLabel('Portfolio').fill('https://e2e.example.com');
  await page.locator('input[type="file"]').setInputFiles(path.join(OUT, 'cover-1.svg'));
  await page.getByRole('button', { name: 'Save Profile' }).click();
  await page.waitForTimeout(1000);
  const me = await apiFetch(`${API}/auth/me`, { headers: authHeaders });
  record('profile', 'update_bio_social_links', me.body.user.bio === `Updated E2E bio ${stamp}` && me.body.user.socialLinks.github.includes('github.com'), JSON.stringify(me.body.user.socialLinks));
  record('profile', 'update_avatar', Boolean(me.body.user.avatar), `avatar=${me.body.user.avatar || ''}`);
  await shot(page, 'profile-updated');
} catch (error) {
  record('profile', 'update_profile', false, error.message);
}

try {
  const adminLogin = await apiFetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav.mehta@devconnect.demo', password: 'Password123!' })
  });
  const adminHeaders = { Authorization: `Bearer ${adminLogin.body.token}` };
  const usersBefore = await apiFetch(`${API}/admin/users`, { headers: adminHeaders });
  const disposable = await apiFetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Disposable Admin Test', email: `delete-${stamp}@devconnect.test`, password: 'Password123!' })
  });
  const deleteUser = await apiFetch(`${API}/admin/user/${disposable.body.user._id}`, { method: 'DELETE', headers: adminHeaders });
  const adminPost = postsDb[1];
  const deleteBlog = await apiFetch(`${API}/admin/post/${adminPost._id}`, { method: 'DELETE', headers: adminHeaders });
  const verifyBlog = await apiFetch(`${API}/posts/${adminPost._id}`, { headers: adminHeaders });
  record('admin', 'view_users', usersBefore.response.ok && usersBefore.body.users.length > 0, `users=${usersBefore.body.users.length}`);
  record('admin', 'delete_user', deleteUser.response.ok, deleteUser.body.message);
  record('admin', 'delete_blog', deleteBlog.response.ok && verifyBlog.response.status === 404, `verify=${verifyBlog.response.status}`);
} catch (error) {
  record('admin', 'admin_tests', false, error.message);
}

for (const width of [320, 375, 768, 1024, 1440]) {
  try {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await shot(page, `responsive-home-${width}`, false);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await shot(page, `responsive-dashboard-${width}`, false);
    record('responsive', `${width}px`, true, 'screenshots captured');
  } catch (error) {
    record('responsive', `${width}px`, false, error.message);
  }
}

try {
  const invalid = await apiFetch(`${API}/posts`, {
    method: 'POST',
    headers: authHeaders,
    body: (() => {
      const fd = new FormData();
      fd.append('title', 'Invalid Upload Test');
      fd.append('category', 'Testing');
      fd.append('tags', 'invalid');
      fd.append('content', 'Invalid upload test with enough content to pass validation.');
      fd.append('status', 'published');
      fd.append('coverImage', new Blob(['not image'], { type: 'text/plain' }), 'invalid-upload.txt');
      return fd;
    })()
  });
  record('errors', 'invalid_image_upload', invalid.response.status >= 400, `status=${invalid.response.status}, message=${invalid.body.message || ''}`);
} catch (error) {
  record('errors', 'invalid_image_upload', false, error.message);
}

try {
  await page.evaluate(() => localStorage.setItem('devconnect_token', 'invalid.token.value'));
  const invalidToken = await apiFetch(`${API}/users/dashboard`, { headers: { Authorization: 'Bearer invalid.token.value' } });
  record('errors', 'invalid_token', invalidToken.response.status === 401, `status=${invalidToken.response.status}, message=${invalidToken.body.message || ''}`);
} catch (error) {
  record('errors', 'invalid_token', false, error.message);
}

try {
  const emptySearch = await apiFetch(`${API}/posts?search=no-results-${stamp}`);
  record('errors', 'empty_search', emptySearch.response.ok && emptySearch.body.posts.length === 0, `results=${emptySearch.body.posts.length}`);
} catch (error) {
  record('errors', 'empty_search', false, error.message);
}

try {
  const emptyDb = await apiFetch(`${API}/posts?category=definitely-empty-${stamp}&autoSeed=false`);
  record('errors', 'empty_database_like_state', emptyDb.response.ok && emptyDb.body.posts.length === 0, `results=${emptyDb.body.posts.length}`);
} catch (error) {
  record('errors', 'empty_database_like_state', false, error.message);
}

await browser.close();
await viteServer.close();
await new Promise((resolve) => apiServer.close(resolve));
await mongoose.default.disconnect();
await fs.writeFile(path.join(OUT, 'e2e-results.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
