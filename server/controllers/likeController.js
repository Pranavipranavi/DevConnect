import Like from '../models/Like.js';
import Post from '../models/Post.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

export const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) throw new ErrorResponse('Post not found', 404);

  const existing = await Like.findOne({ postId: post._id, userId: req.user._id });
  if (existing) {
    await existing.deleteOne();
    post.likes = Math.max(0, post.likes - 1);
    await post.save();
    return res.json({ liked: false, likes: post.likes });
  }

  await Like.create({ postId: post._id, userId: req.user._id });
  post.likes += 1;
  await post.save();
  res.status(201).json({ liked: true, likes: post.likes });
});
