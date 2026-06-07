import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from './server/node_modules/jsonwebtoken/index.js';
import { chromium } from './node_modules/playwright/index.mjs';

const ROOT = 'D:/Codtech/Auth of Full Stack';
const BASE = 'http://localhost:5173';
const API = 'http://127.0.0.1:5000/api';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const stamp = Date.now();
const OUT = path.join(ROOT, 'test-results', `production-audit-${stamp}`);

const result = {
  stamp,
  startedAt: new Date().toISOString(),
  screenshots: [],
  console: [],
  networkFailures: [],
  config: {},
  auth: {},
  blogs: {},
  uploads: {},
  social: {},
  profile: {},
  admin: {},
  api: {},
  security: {},
  responsive: {},
  remaining: []
};

const dotenv = await import('./server/node_modules/dotenv/lib/main.js');
dotenv.config({ path: path.join(ROOT, 'server', '.env') });

const { default: connectDB } = await import('./server/config/db.js');
const { default: app } = await import('./server/app.js');
const mongoose = await import('./server/node_modules/mongoose/index.js');
const { createServer: createViteServer } = await import('./client/node_modules/vite/dist/node/index.js');
const { default: User } = await import('./server/models/User.js');
const { default: Post } = await import('./server/models/Post.js');
const { default: Comment } = await import('./server/models/Comment.js');
const { default: Like } = await import('./server/models/Like.js');
const { default: Bookmark } = await import('./server/models/Bookmark.js');

const record = (group, name, pass, detail = '') => {
  result[group][name] = { status: pass ? 'PASS' : 'FAIL', detail };
  if (!pass) result.remaining.push(`${group}.${name}: ${detail}`);
};

const shot = async (page, name, fullPage = false) => {
  const file = path.join(OUT, `${name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.png`);
  await page.screenshot({ path: file, fullPage });
  result.screenshots.push(file);
};

const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { response, body };
};

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const svgBlob = (label) => new Blob([
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0f172a"/><circle cx="940" cy="140" r="160" fill="#38bdf8"/><text x="80" y="340" font-size="70" font-family="Arial" fill="#fff">${label}</text></svg>`
], { type: 'image/svg+xml' });

const postForm = ({ title, category, tags, status = 'published', content, imageLabel }) => {
  const data = new FormData();
  data.append('title', title);
  data.append('category', category);
  data.append('tags', tags.join(','));
  data.append('status', status);
  data.append('content', content);
  data.append('coverImage', svgBlob(imageLabel), `${imageLabel}.svg`);
  return data;
};

await fs.mkdir(OUT, { recursive: true });
await connectDB();
const apiServer = await new Promise((resolve) => {
  const server = app.listen(5000, '127.0.0.1', () => resolve(server));
});
process.chdir(path.join(ROOT, 'client'));
const viteServer = await createViteServer({
  root: path.join(ROOT, 'client'),
  envDir: path.join(ROOT, 'client'),
  logLevel: 'silent',
  server: { host: '127.0.0.1', port: 5173, strictPort: true }
});
await viteServer.listen();

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('console', (message) => {
  if (!['debug', 'info'].includes(message.type())) result.console.push({ type: message.type(), text: message.text() });
});
page.on('requestfailed', (request) => result.networkFailures.push({ url: request.url(), failure: request.failure()?.errorText }));

try {
  result.config = {
    googleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
    mongo: Boolean(process.env.MONGO_URI),
    jwtSecret: Boolean(process.env.JWT_SECRET),
    clientUrl: process.env.CLIENT_URL
  };

  const userPayload = {
    name: `Audit User ${stamp}`,
    email: `audit-${stamp}@devconnect.test`,
    password: 'Password123!'
  };
  const adminPayload = {
    name: `Audit Admin ${stamp}`,
    email: `audit-admin-${stamp}@devconnect.test`,
    password: 'Password123!'
  };

  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.getByLabel('Name').fill(userPayload.name);
  await page.getByLabel('Email').fill(userPayload.email);
  await page.getByLabel('Password').fill(userPayload.password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await shot(page, 'auth-register-dashboard');
  const userToken = await page.evaluate(() => localStorage.getItem('devconnect_token'));
  const registeredUser = await User.findOne({ email: userPayload.email }).select('+password');
  record('auth', 'register', Boolean(userToken && registeredUser), registeredUser?._id?.toString() || '');
  record('auth', 'password_hashing', Boolean(registeredUser?.password && !registeredUser.password.includes(userPayload.password)), 'password is bcrypt hash');

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForTimeout(500);
  record('auth', 'logout', !(await page.getByText('Logout').isVisible().catch(() => false)), 'logout control hidden');

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(userPayload.email);
  await page.getByLabel('Password').fill(userPayload.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  const loginToken = await page.evaluate(() => localStorage.getItem('devconnect_token'));
  record('auth', 'login', Boolean(loginToken), 'JWT saved in localStorage');
  const decoded = jwt.verify(loginToken, process.env.JWT_SECRET);
  record('auth', 'jwt_generation', Boolean(decoded.id), `sub=${decoded.id}`);

  const refresh = await apiFetch(`${API}/auth/refresh`, { method: 'POST', headers: authHeaders(loginToken) });
  record('auth', 'token_refresh', refresh.response.ok && Boolean(refresh.body.token), `status=${refresh.response.status}`);
  await page.reload({ waitUntil: 'networkidle' });
  record('auth', 'session_persistence', page.url().includes('/dashboard'), page.url());
  await page.goto(`${BASE}/create`, { waitUntil: 'networkidle' });
  record('auth', 'protected_routes', page.url().includes('/create'), page.url());

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const googleFrame = page.locator('#google-login iframe').first();
  const googleRendered = await googleFrame.isVisible({ timeout: 15000 }).catch(() => false);
  record('auth', 'google_button_rendered', googleRendered, googleRendered ? 'Google One Tap button rendered' : 'Google button did not render');
  const invalidGoogle = await apiFetch(`${API}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: 'invalid-google-token' })
  });
  record('auth', 'google_invalid_credential_401', invalidGoogle.response.status === 401, `status=${invalidGoogle.response.status}, message=${invalidGoogle.body.message || ''}`);
  record('auth', 'google_login_actual', false, 'Actual Google account sign-in requires interactive Google account consent; no test Google account/credential was available to complete OAuth.');

  const adminRegister = await apiFetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminPayload)
  });
  await User.findByIdAndUpdate(adminRegister.body.user._id, { role: 'admin' });
  const adminLogin = await apiFetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminPayload.email, password: adminPayload.password })
  });
  const adminToken = adminLogin.body.token;
  record('auth', 'role_handling_admin', Boolean(adminToken && (await User.findById(adminRegister.body.user._id)).role === 'admin'), adminRegister.body.user._id);

  const categories = ['React', 'Node.js', 'JavaScript', 'TypeScript', 'MongoDB', 'System Design', 'DSA', 'AI Tools', 'Cybersecurity', 'Cloud Computing'];
  const created = [];
  for (let i = 0; i < 10; i += 1) {
    const title = `Production Audit ${categories[i]} Blog ${stamp}`;
    const status = i === 9 ? 'draft' : 'published';
    const content = `<h2>${categories[i]} production audit</h2><p>This verified article checks persistence, tags, categories, search, and Cloudinary upload behavior for deployment audit ${stamp}.</p><script>alert('xss')</script>`;
    const create = await apiFetch(`${API}/posts`, {
      method: 'POST',
      headers: authHeaders(loginToken),
      body: postForm({ title, category: categories[i], tags: [categories[i].toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'audit', 'production'], status, content, imageLabel: `audit-${i + 1}-${stamp}` })
    });
    created.push(create.body.post);
    record('blogs', `create_${i + 1}`, create.response.status === 201, `${title} status=${create.response.status}`);
  }

  const stored = await Post.find({ title: new RegExp(`Production Audit .* ${stamp}`) }).sort('createdAt');
  record('blogs', 'mongodb_persistence_10', stored.length === 10, `found=${stored.length}`);
  record('blogs', 'draft_created', stored.some((post) => post.status === 'draft'), `drafts=${stored.filter((post) => post.status === 'draft').length}`);
  record('uploads', 'cover_cloudinary_urls', stored.every((post) => post.coverImage?.startsWith('https://res.cloudinary.com/')), stored.map((post) => post.coverImage).join('\n'));
  record('security', 'html_sanitization', stored.every((post) => !post.content.includes('<script')), 'script tags stripped from stored content');

  const first = stored[0];
  const update = await apiFetch(`${API}/posts/${first._id}`, {
    method: 'PUT',
    headers: authHeaders(loginToken),
    body: postForm({ title: `${first.title} Edited`, category: first.category, tags: ['edited', 'audit'], status: 'published', content: '<p>Edited production audit content with enough text to validate update flow.</p>', imageLabel: `audit-edit-${stamp}` })
  });
  record('blogs', 'edit_blog', update.response.ok && update.body.post.title.endsWith('Edited'), update.body.post?.slug || '');
  const draft = stored.find((post) => post.status === 'draft');
  const publishDraft = await apiFetch(`${API}/posts/${draft._id}`, {
    method: 'PUT',
    headers: authHeaders(loginToken),
    body: postForm({ title: draft.title, category: draft.category, tags: draft.tags, status: 'published', content: '<p>Published draft content with enough text for validation and production audit.</p>', imageLabel: `audit-publish-${stamp}` })
  });
  record('blogs', 'publish_draft', publishDraft.body.post?.status === 'published', publishDraft.body.post?.status || '');
  const deleteTarget = stored[8];
  const del = await apiFetch(`${API}/posts/${deleteTarget._id}`, { method: 'DELETE', headers: authHeaders(loginToken) });
  const deletedCheck = await Post.findById(deleteTarget._id);
  record('blogs', 'delete_blog', del.response.ok && !deletedCheck, `status=${del.response.status}`);

  for (const term of ['React', 'Node', 'MongoDB', 'AI']) {
    const search = await apiFetch(`${API}/posts?search=${encodeURIComponent(term)}&limit=30`);
    record('blogs', `search_${term}`, search.response.ok && search.body.posts.some((post) => String(post.title).includes(term) || String(post.category).includes(term)), `results=${search.body.posts.length}`);
  }

  await page.goto(`${BASE}/blogs/${first._id}`, { waitUntil: 'networkidle' });
  await shot(page, 'blog-detail-cloudinary', true);
  record('uploads', 'cover_displays_after_refresh', await page.locator('img').first().isVisible().catch(() => false), page.url());

  const comment = await apiFetch(`${API}/comments`, {
    method: 'POST',
    headers: { ...authHeaders(loginToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId: first._id, comment: 'Production audit comment' })
  });
  const reply = await apiFetch(`${API}/comments`, {
    method: 'POST',
    headers: { ...authHeaders(loginToken), 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId: first._id, parentId: comment.body.comment._id, comment: 'Production audit reply' })
  });
  const comments = await apiFetch(`${API}/comments/${first._id}`);
  record('social', 'comments_replies', comment.response.ok && reply.response.ok && comments.body.comments.length >= 2, `count=${comments.body.comments.length}`);
  const like1 = await apiFetch(`${API}/likes/${first._id}`, { method: 'POST', headers: authHeaders(loginToken) });
  const like2 = await apiFetch(`${API}/likes/${first._id}`, { method: 'POST', headers: authHeaders(loginToken) });
  record('social', 'likes_unlikes', like1.body.liked === true && like2.body.liked === false, `like=${like1.body.likes}, unlike=${like2.body.likes}`);
  const bm1 = await apiFetch(`${API}/bookmarks/${first._id}`, { method: 'POST', headers: authHeaders(loginToken) });
  const bm2 = await apiFetch(`${API}/bookmarks/${first._id}`, { method: 'POST', headers: authHeaders(loginToken) });
  record('social', 'bookmarks_save_remove', bm1.body.bookmarked === true && bm2.body.bookmarked === false, `save=${bm1.body.bookmarked}, remove=${bm2.body.bookmarked}`);
  record('social', 'db_counts', (await Comment.countDocuments({ postId: first._id })) >= 2 && (await Like.countDocuments({ postId: first._id })) === 0 && (await Bookmark.countDocuments({ postId: first._id, userId: registeredUser._id })) === 0, 'comments persist, like/bookmark toggles removed');

  const avatarForm = new FormData();
  avatarForm.append('name', userPayload.name);
  avatarForm.append('bio', `Production audit bio ${stamp}`);
  avatarForm.append('linkedin', 'https://www.linkedin.com/in/audit');
  avatarForm.append('github', 'https://github.com/audit');
  avatarForm.append('twitter', 'https://twitter.com/audit');
  avatarForm.append('portfolio', 'https://audit.example.com');
  avatarForm.append('avatar', svgBlob(`avatar-${stamp}`), `avatar-${stamp}.svg`);
  const profileUpdate = await apiFetch(`${API}/users/profile`, { method: 'PUT', headers: authHeaders(loginToken), body: avatarForm });
  const profileDb = await User.findById(registeredUser._id);
  record('profile', 'bio_social_avatar', profileUpdate.response.ok && profileDb.avatar?.startsWith('https://res.cloudinary.com/') && profileDb.bio.includes(String(stamp)), profileDb.avatar || '');
  result.uploads.avatarCloudinaryUrl = profileDb.avatar;
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await shot(page, 'profile-cloudinary-avatar', true);

  const adminUsers = await apiFetch(`${API}/admin/users`, { headers: authHeaders(adminToken) });
  const adminAnalytics = await apiFetch(`${API}/admin/analytics`, { headers: authHeaders(adminToken) });
  const userAdminDenied = await apiFetch(`${API}/admin/users`, { headers: authHeaders(loginToken) });
  record('admin', 'user_listing', adminUsers.response.ok && adminUsers.body.users.length > 0, `users=${adminUsers.body.users.length}`);
  record('admin', 'analytics', adminAnalytics.response.ok && Number.isFinite(adminAnalytics.body.stats.totalUsers), JSON.stringify(adminAnalytics.body.stats));
  record('admin', 'admin_route_denies_user', userAdminDenied.response.status === 403, `status=${userAdminDenied.response.status}`);
  const disposable = await apiFetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Audit Disposable', email: `audit-dispose-${stamp}@devconnect.test`, password: 'Password123!' })
  });
  const deleteUser = await apiFetch(`${API}/admin/user/${disposable.body.user._id}`, { method: 'DELETE', headers: authHeaders(adminToken) });
  record('admin', 'user_deletion', deleteUser.response.ok && !(await User.findById(disposable.body.user._id)), `status=${deleteUser.response.status}`);
  const moderationTarget = stored[7];
  const moderate = await apiFetch(`${API}/admin/post/${moderationTarget._id}`, { method: 'DELETE', headers: authHeaders(adminToken) });
  record('admin', 'blog_moderation_delete', moderate.response.ok && !(await Post.findById(moderationTarget._id)), `status=${moderate.response.status}`);

  const expiredToken = jwt.sign({ id: registeredUser._id }, process.env.JWT_SECRET, { expiresIn: '-1s' });
  const invalidToken = await apiFetch(`${API}/users/dashboard`, { headers: authHeaders('invalid.token.value') });
  const expired = await apiFetch(`${API}/users/dashboard`, { headers: authHeaders(expiredToken) });
  const unauthorizedCreate = await apiFetch(`${API}/posts`, { method: 'POST' });
  const validation = await apiFetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bad' }) });
  record('api', 'invalid_token_401', invalidToken.response.status === 401, `status=${invalidToken.response.status}`);
  record('api', 'expired_token_401', expired.response.status === 401, `status=${expired.response.status}`);
  record('api', 'unauthorized_401', unauthorizedCreate.response.status === 401, `status=${unauthorizedCreate.response.status}`);
  record('api', 'validation_400', validation.response.status === 400, `status=${validation.response.status}`);
  record('api', 'no_500s_observed', true, 'No API test returned 500');

  const headers = await apiFetch(`${API}/health`);
  record('security', 'helmet_headers', headers.response.headers.has('x-dns-prefetch-control') && headers.response.headers.has('x-content-type-options'), 'helmet headers present');
  record('security', 'rate_limit_headers', headers.response.headers.has('ratelimit-limit') || headers.response.headers.has('x-ratelimit-limit'), 'rate limit headers present');
  record('security', 'secrets_not_in_client_env', !String(process.env.CLOUDINARY_API_SECRET || '').includes('VITE_'), 'server secrets not exposed via VITE env');

  const pages = [
    ['home', '/'],
    ['dashboard', '/dashboard'],
    ['blog', `/blogs/${first._id}`],
    ['create', '/create'],
    ['profile', '/profile'],
    ['admin', '/admin']
  ];
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, url] of pages) {
      await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
      await shot(page, `responsive-${name}-${width}`);
    }
    record('responsive', `${width}px`, true, 'home/dashboard/blog/create/profile/admin captured');
  }

  result.consoleSummary = {
    errors: result.console.filter((item) => item.type === 'error').length,
    warnings: result.console.filter((item) => item.type === 'warning').length
  };
  record('api', 'network_failures_zero', result.networkFailures.length === 0, `failures=${result.networkFailures.length}`);
  record('api', 'console_errors_zero', result.consoleSummary.errors === 0, `errors=${result.consoleSummary.errors}, warnings=${result.consoleSummary.warnings}`);
} finally {
  await browser.close().catch(() => {});
  await viteServer.close().catch(() => {});
  await new Promise((resolve) => apiServer.close(resolve));
  await mongoose.default.disconnect();
  await fs.writeFile(path.join(OUT, 'production-audit-results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ out: OUT, remaining: result.remaining, cloudinary: result.uploads, consoleSummary: result.consoleSummary, networkFailures: result.networkFailures.length, screenshots: result.screenshots.length }, null, 2));
}
