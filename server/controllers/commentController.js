import { body } from 'express-validator';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

export const commentRules = [
  body('postId').isMongoId().withMessage('Valid post ID is required'),
  body('comment').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty')
];

export const createComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.body.postId);
  if (!post) throw new ErrorResponse('Post not found', 404);

  const comment = await Comment.create({
    postId: req.body.postId,
    userId: req.user._id,
    comment: req.body.comment,
    parentComment: req.body.parentComment || null
  });

  await comment.populate('userId', 'name avatar');
  res.status(201).json({ comment });
});

export const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ postId: req.params.postId }).populate('userId', 'name avatar').sort('createdAt');
  res.json({ comments });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ErrorResponse('Comment not found', 404);
  if (String(comment.userId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ErrorResponse('You can only delete your own comments', 403);
  }

  await Comment.deleteMany({ $or: [{ _id: comment._id }, { parentComment: comment._id }] });
  res.json({ message: 'Comment deleted' });
});
