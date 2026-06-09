import { createRequire } from 'module';

const require = createRequire(new URL('./server/package.json', import.meta.url));
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './server/.env' });
process.env.PORT = process.env.PORT || '5011';

const { default: app } = await import('./server/app.js');
const { default: connectDB } = await import('./server/config/db.js');
const { default: User } = await import('./server/models/User.js');
const { default: Post } = await import('./server/models/Post.js');
const { default: Comment } = await import('./server/models/Comment.js');
const { default: Like } = await import('./server/models/Like.js');
const { default: Bookmark } = await import('./server/models/Bookmark.js');

const port = 5011;
const base = `http://127.0.0.1:${port}/api`;
const results = [];

const record = (name, pass, details = {}) => {
  results.push({ name, pass, ...details });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`, details);
};

const request = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (options.json) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.json);
    delete options.json;
  }
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { status: response.status, body };
};

const authed = (token) => ({ Authorization: `Bearer ${token}` });

let server;
try {
  await connectDB();
  server = app.listen(port);

  const stamp = Date.now();
  const email = `qa-${stamp}@example.com`;
  const password = 'Password123!';

  const register = await request('/auth/register', {
    method: 'POST',
    json: { name: 'QA Release User', email, password }
  });
  const token = register.body.token;
  const userId = register.body.user?._id;
  record('Register new user', register.status === 201 && Boolean(token) && !register.body.user?.password, {
    status: register.status,
    message: register.body.message || 'token returned',
    userId
  });

  const registeredUser = await User.findOne({ email }).select('+password');
  record('Database user created and password hashed', Boolean(registeredUser && registeredUser.password && registeredUser.password !== password), {
    userId: registeredUser?._id?.toString()
  });

  const duplicate = await request('/auth/register', {
    method: 'POST',
    json: { name: 'QA Release User', email, password }
  });
  record('Register existing email returns friendly 409', duplicate.status === 409 && duplicate.body.message === 'An account with this email already exists. Please login.', {
    status: duplicate.status,
    message: duplicate.body.message
  });

  const login = await request('/auth/login', {
    method: 'POST',
    json: { email, password }
  });
  const loginToken = login.body.token;
  record('Login', login.status === 200 && Boolean(loginToken), {
    status: login.status,
    message: login.body.message || 'token returned'
  });

  const me = await request('/auth/me', { headers: authed(loginToken) });
  record('JWT authentication and protected route access', me.status === 200 && me.body.user?.email === email, {
    status: me.status,
    email: me.body.user?.email
  });

  const invalidToken = await request('/auth/me', { headers: authed('invalid.token.value') });
  record('Invalid token returns 401 friendly message', invalidToken.status === 401 && invalidToken.body.message === 'Please login again', {
    status: invalidToken.status,
    message: invalidToken.body.message
  });

  const logout = await request('/auth/logout', { method: 'POST', headers: authed(loginToken) });
  record('Logout API responds successfully', logout.status === 200, {
    status: logout.status,
    message: logout.body.message
  });

  const seedOne = await request('/seed/demo', { method: 'POST' });
  const seedTwo = await request('/seed/demo', { method: 'POST' });
  const seedMessagesOk = [seedOne.body.message, seedTwo.body.message].every((message) => (
    message === 'Sample data generated successfully' || message === 'Sample data already exists'
  ));
  record('Sample data endpoint is idempotent and friendly', seedOne.status < 500 && seedTwo.status < 500 && seedMessagesOk, {
    first: { status: seedOne.status, message: seedOne.body.message, created: seedOne.body.created },
    second: { status: seedTwo.status, message: seedTwo.body.message, created: seedTwo.body.created }
  });

  const demoUsers = await User.countDocuments({ email: /@devconnect\.demo$/ });
  const demoPosts = await Post.countDocuments({ title: { $in: [
    'Building React Interfaces That Stay Fast Under Real Data',
    'Designing Node.js APIs That Are Easy to Test and Extend',
    'MongoDB Indexing Strategies for High-Traffic Blog Platforms'
  ] } });
  record('Database contains demo users and posts after seed', demoUsers >= 8 && demoPosts >= 3, {
    demoUsers,
    sampledDemoPosts: demoPosts
  });

  const postTitle = `QA React Error Handling ${stamp}`;
  const postCreate = await request('/posts', {
    method: 'POST',
    headers: authed(loginToken),
    json: {
      title: postTitle,
      content: '<p>This QA blog verifies create, search, comments, likes, bookmarks, and dashboard updates with friendly error handling.</p>',
      category: 'React',
      tags: ['react', 'qa', 'error-handling'],
      status: 'published'
    }
  });
  const post = postCreate.body.post;
  record('Create Blog', postCreate.status === 201 && post?.title === postTitle, {
    status: postCreate.status,
    postId: post?._id,
    slug: post?.slug
  });

  const persistedPost = await Post.findById(post?._id);
  record('Database updated after blog create', Boolean(persistedPost && String(persistedPost.author) === String(userId)), {
    postId: persistedPost?._id?.toString()
  });

  const search = await request('/posts?search=React&autoSeed=false');
  record('Search returns React results including created blog', search.status === 200 && search.body.posts?.some((item) => item._id === post?._id), {
    status: search.status,
    resultCount: search.body.posts?.length
  });

  const dashboard = await request('/users/dashboard', { headers: authed(loginToken) });
  record('Dashboard includes created blog', dashboard.status === 200 && dashboard.body.posts?.some((item) => item._id === post?._id), {
    status: dashboard.status,
    totalBlogs: dashboard.body.stats?.totalBlogs
  });

  const commentCreate = await request('/comments', {
    method: 'POST',
    headers: authed(loginToken),
    json: { postId: post._id, comment: 'QA parent comment verifies the comment flow.' }
  });
  const comment = commentCreate.body.comment;
  record('Add comment', commentCreate.status === 201 && comment?.comment.includes('QA parent'), {
    status: commentCreate.status,
    commentId: comment?._id
  });

  const replyCreate = await request('/comments', {
    method: 'POST',
    headers: authed(loginToken),
    json: { postId: post._id, parentComment: comment._id, comment: 'QA reply verifies threaded replies.' }
  });
  const reply = replyCreate.body.comment;
  record('Add reply', replyCreate.status === 201 && Boolean(reply?.parentComment), {
    status: replyCreate.status,
    replyId: reply?._id
  });

  const commentsInDb = await Comment.countDocuments({ postId: post._id });
  record('Database updated after comments/replies', commentsInDb >= 2, { commentsInDb });

  const deleteReply = await request(`/comments/${reply._id}`, { method: 'DELETE', headers: authed(loginToken) });
  const replyStillExists = await Comment.exists({ _id: reply._id });
  record('Delete comment/reply', deleteReply.status === 200 && !replyStillExists, {
    status: deleteReply.status,
    message: deleteReply.body.message
  });

  const likeOne = await request(`/likes/${post._id}`, { method: 'POST', headers: authed(loginToken) });
  const likesAfterOne = await Like.countDocuments({ postId: post._id });
  const likeTwo = await request(`/likes/${post._id}`, { method: 'POST', headers: authed(loginToken) });
  const likesAfterTwo = await Like.countDocuments({ postId: post._id });
  record('Like and unlike counters update', likeOne.status === 201 && likeOne.body.liked === true && likeTwo.status === 200 && likeTwo.body.liked === false && likesAfterOne === 1 && likesAfterTwo === 0, {
    like: { status: likeOne.status, liked: likeOne.body.liked, likes: likeOne.body.likes, dbCount: likesAfterOne },
    unlike: { status: likeTwo.status, liked: likeTwo.body.liked, likes: likeTwo.body.likes, dbCount: likesAfterTwo }
  });

  const bookmarkOne = await request(`/bookmarks/${post._id}`, { method: 'POST', headers: authed(loginToken) });
  const bookmarksAfterOne = await Bookmark.countDocuments({ postId: post._id, userId });
  const bookmarksView = await request('/bookmarks', { headers: authed(loginToken) });
  const bookmarkTwo = await request(`/bookmarks/${post._id}`, { method: 'POST', headers: authed(loginToken) });
  const bookmarksAfterTwo = await Bookmark.countDocuments({ postId: post._id, userId });
  record('Bookmark save/remove and dashboard data update', bookmarkOne.status === 201 && bookmarksAfterOne === 1 && bookmarksView.body.posts?.some((item) => item._id === post._id) && bookmarkTwo.status === 200 && bookmarksAfterTwo === 0, {
    save: { status: bookmarkOne.status, bookmarked: bookmarkOne.body.bookmarked, dbCount: bookmarksAfterOne },
    remove: { status: bookmarkTwo.status, bookmarked: bookmarkTwo.body.bookmarked, dbCount: bookmarksAfterTwo }
  });

  const deletePost = await request(`/posts/${post._id}`, { method: 'DELETE', headers: authed(loginToken) });
  const postStillExists = await Post.exists({ _id: post._id });
  record('Cleanup delete blog removes test post', deletePost.status === 200 && !postStillExists, {
    status: deletePost.status,
    message: deletePost.body.message
  });
} catch (error) {
  record('Verification runner crashed', false, { message: error.message, stack: error.stack });
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  const failed = results.filter((item) => !item.pass);
  console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  if (failed.length) process.exit(1);
}
