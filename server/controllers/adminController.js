import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.json({ users });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ErrorResponse('Admins cannot delete themselves', 400);

  const user = await User.findById(req.params.id);
  if (!user) throw new ErrorResponse('User not found', 404);

  const posts = await Post.find({ author: user._id }).select('_id');
  await Promise.all([
    Comment.deleteMany({ $or: [{ userId: user._id }, { postId: { $in: posts.map((post) => post._id) } }] }),
    Like.deleteMany({ $or: [{ userId: user._id }, { postId: { $in: posts.map((post) => post._id) } }] }),
    Bookmark.deleteMany({ $or: [{ userId: user._id }, { postId: { $in: posts.map((post) => post._id) } }] }),
    Post.deleteMany({ author: user._id }),
    user.deleteOne()
  ]);

  res.json({ message: 'User and related content deleted' });
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  const [totalUsers, totalBlogs, totalComments, viewsAgg] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Comment.countDocuments(),
    Post.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }])
  ]);

  res.json({
    stats: {
      totalUsers,
      totalBlogs,
      totalComments,
      totalViews: viewsAgg[0]?.totalViews || 0
    }
  });
});
