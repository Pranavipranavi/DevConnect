import Bookmark from '../models/Bookmark.js';
import Post from '../models/Post.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

export const toggleBookmark = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) throw new ErrorResponse('Post not found', 404);

  const existing = await Bookmark.findOne({ postId: post._id, userId: req.user._id });
  if (existing) {
    await existing.deleteOne();
    return res.json({ bookmarked: false });
  }

  await Bookmark.create({ postId: post._id, userId: req.user._id });
  res.status(201).json({ bookmarked: true });
});

export const getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user._id })
    .populate({
      path: 'postId',
      populate: { path: 'author', select: 'name avatar bio' }
    })
    .sort('-createdAt');

  res.json({ posts: bookmarks.map((bookmark) => bookmark.postId).filter(Boolean) });
});
