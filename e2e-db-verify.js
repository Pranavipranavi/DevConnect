import mongoose from './server/node_modules/mongoose/index.js';

const stamp = process.argv[2];
await mongoose.connect('mongodb://127.0.0.1:27017/devconnect');
const db = mongoose.connection.db;
const posts = await db.collection('posts')
  .find({ title: { $regex: `E2E Production Blog .*${stamp}` } })
  .project({ title: 1, slug: 1, coverImage: 1, status: 1, category: 1, tags: 1, likes: 1, views: 1 })
  .toArray();
const user = await db.collection('users').findOne(
  { email: `e2e-${stamp}@devconnect.test` },
  { projection: { email: 1, bio: 1, avatar: 1, socialLinks: 1 } }
);
const focusedCommentsRemaining = await db.collection('comments').countDocuments({ comment: { $regex: 'Focused' } });
const bookmarksForUser = user ? await db.collection('bookmarks').countDocuments({ userId: user._id }) : null;
console.log(JSON.stringify({ stamp, postsFound: posts.length, posts, user, focusedCommentsRemaining, bookmarksForUser }, null, 2));
await mongoose.disconnect();
