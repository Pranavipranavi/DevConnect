import Post from '../models/Post.js';
import User from '../models/User.js';
import Bookmark from '../models/Bookmark.js';
import Like from '../models/Like.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { uploadImage } from '../services/uploadService.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id || req.user._id).select('-password');
  if (!user) throw new ErrorResponse('User not found', 404);
  const [totalPosts, posts, likesAgg] = await Promise.all([
    Post.countDocuments({ author: user._id, status: 'published' }),
    Post.find({ author: user._id, status: 'published' }).sort('-createdAt').limit(12).populate('author', 'name avatar'),
    Post.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, totalLikes: { $sum: '$likes' }, totalViews: { $sum: '$views' } } }
    ])
  ]);

  res.json({
    user,
    stats: {
      totalPosts,
      totalLikes: likesAgg[0]?.totalLikes || 0,
      totalViews: likesAgg[0]?.totalViews || 0
    },
    posts
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const avatar = req.file ? await uploadImage(req.file, 'avatars') : undefined;
  const updates = {
    name: req.body.name,
    bio: req.body.bio,
    socialLinks: {
      linkedin: req.body.linkedin,
      github: req.body.github,
      twitter: req.body.twitter,
      portfolio: req.body.portfolio
    }
  };
  if (avatar) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
  res.json({ user });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const [posts, totalComments, totalLikedPosts, bookmarks] = await Promise.all([
    Post.find({ author: req.user._id }).sort('-updatedAt'),
    Post.aggregate([
      { $match: { author: req.user._id } },
      { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
      { $project: { count: { $size: '$comments' } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]),
    Like.countDocuments({ userId: req.user._id }),
    Bookmark.find({ userId: req.user._id }).populate({
      path: 'postId',
      populate: { path: 'author', select: 'name avatar bio' }
    }).sort('-createdAt')
  ]);

  const stats = posts.reduce((acc, post) => ({
    totalBlogs: acc.totalBlogs + 1,
    totalLikes: acc.totalLikes + post.likes,
    totalViews: acc.totalViews + post.views
  }), { totalBlogs: 0, totalLikes: 0, totalViews: 0 });

  res.json({
    posts,
    bookmarks: bookmarks.map((bookmark) => bookmark.postId).filter(Boolean),
    stats: {
      ...stats,
      totalComments: totalComments[0]?.total || 0,
      totalLikedPosts
    }
  });
});
