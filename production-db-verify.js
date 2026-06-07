import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'D:/Codtech/Auth of Full Stack';
const stamp = process.argv[2];
if (!stamp) throw new Error('Usage: node production-db-verify.js <stamp>');

const dotenv = await import('./server/node_modules/dotenv/lib/main.js');
dotenv.config({ path: path.join(ROOT, 'server', '.env') });

const { default: connectDB } = await import('./server/config/db.js');
const mongoose = await import('./server/node_modules/mongoose/index.js');
const { default: Post } = await import('./server/models/Post.js');
const { default: User } = await import('./server/models/User.js');
const { default: Comment } = await import('./server/models/Comment.js');
const { default: Like } = await import('./server/models/Like.js');
const { default: Bookmark } = await import('./server/models/Bookmark.js');

await connectDB();

const posts = await Post.find({ title: new RegExp(stamp) })
  .select('title slug status category tags coverImage likes views')
  .lean();
const user = await User.findOne({ email: `audit-${stamp}@devconnect.test` })
  .select('email role avatar bio socialLinks password')
  .lean();
const postIds = posts.map((post) => post._id);

const out = {
  stamp,
  postsFound: posts.length,
  posts,
  user: user ? {
    _id: user._id,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    socialLinks: user.socialLinks,
    passwordHashPresent: Boolean(user.password),
    passwordLooksBcrypt: /^\$2[aby]\$/.test(user.password || '')
  } : null,
  comments: await Comment.countDocuments({ postId: { $in: postIds } }),
  likes: await Like.countDocuments({ postId: { $in: postIds } }),
  bookmarks: await Bookmark.countDocuments({ postId: { $in: postIds } })
};

const file = path.join(ROOT, 'test-results', `production-db-verify-${stamp}.json`);
await fs.writeFile(file, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await mongoose.default.disconnect();
