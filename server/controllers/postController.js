import { body } from 'express-validator';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Bookmark from '../models/Bookmark.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import { createSlug } from '../utils/slug.js';
import { calculateReadingTime } from '../utils/readingTime.js';
import { uploadImage } from '../services/uploadService.js';
import { sanitizeContent } from '../utils/sanitizeContent.js';
import { seedDemoContent } from '../services/seedService.js';

export const postRules = [
  body('title').trim().isLength({ min: 4 }).withMessage('Title must be at least 4 characters'),
  body('content').isLength({ min: 20 }).withMessage('Content must be at least 20 characters'),
  body('category').trim().notEmpty().withMessage('Category is required')
];

const parseTags = (tags) => Array.isArray(tags)
  ? tags
  : String(tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

export const getPosts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 9, 30);
  const skip = (page - 1) * limit;
  const query = { status: 'published' };
  const sortMap = {
    latest: '-createdAt',
    popular: '-views -likes',
    viewed: '-views',
    liked: '-likes'
  };

  if (req.query.search) {
    const term = req.query.search.trim();
    const authors = await User.find({ name: new RegExp(term, 'i') }).select('_id');
    query.$or = [
      { title: new RegExp(term, 'i') },
      { category: new RegExp(term, 'i') },
      { tags: new RegExp(term, 'i') },
      { author: { $in: authors.map((user) => user._id) } }
    ];
  }

  if (req.query.category) query.category = req.query.category;
  if (req.query.tag) query.tags = req.query.tag.toLowerCase();

  let [posts, total] = await Promise.all([
    Post.find(query).populate('author', 'name avatar bio').sort(sortMap[req.query.sort] || sortMap.latest).skip(skip).limit(limit),
    Post.countDocuments(query)
  ]);

  if (total === 0 && !req.query.search && !req.query.category && !req.query.tag && req.query.autoSeed !== 'false') {
    await seedDemoContent();
    [posts, total] = await Promise.all([
      Post.find(query).populate('author', 'name avatar bio').sort(sortMap[req.query.sort] || sortMap.latest).skip(skip).limit(limit),
      Post.countDocuments(query)
    ]);
  }

  res.json({ posts, page, pages: Math.ceil(total / limit), total });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { slug: req.params.id }] })
    .populate('author', 'name avatar bio socialLinks');
  if (!post) throw new ErrorResponse('Post not found', 404);

  if (post.status !== 'published' && String(post.author._id) !== String(req.user?._id) && req.user?.role !== 'admin') {
    throw new ErrorResponse('Post not found', 404);
  }

  post.views += 1;
  await post.save();

  const [comments, liked, bookmarked] = await Promise.all([
    Comment.find({ postId: post._id }).populate('userId', 'name avatar').sort('createdAt'),
    req.user ? Like.exists({ postId: post._id, userId: req.user._id }) : null,
    req.user ? Bookmark.exists({ postId: post._id, userId: req.user._id }) : null
  ]);

  res.json({ post, comments, liked: Boolean(liked), bookmarked: Boolean(bookmarked) });
});

export const createPost = asyncHandler(async (req, res) => {
  const coverImage = req.file ? await uploadImage(req.file, 'covers') : req.body.coverImage;
  const slug = await createSlug(req.body.slug || req.body.title);
  const content = sanitizeContent(req.body.content);
  const post = await Post.create({
    title: req.body.title,
    slug,
    content,
    coverImage,
    category: req.body.category,
    tags: parseTags(req.body.tags),
    author: req.user._id,
    status: req.body.status === 'published' ? 'published' : 'draft',
    readingTime: calculateReadingTime(content)
  });

  res.status(201).json({ post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ErrorResponse('Post not found', 404);
  if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ErrorResponse('You can only edit your own posts', 403);
  }

  const coverImage = req.file ? await uploadImage(req.file, 'covers') : req.body.coverImage || post.coverImage;
  post.title = req.body.title ?? post.title;
  post.slug = await createSlug(req.body.slug || post.title, post._id);
  post.content = req.body.content ? sanitizeContent(req.body.content) : post.content;
  post.coverImage = coverImage;
  post.category = req.body.category ?? post.category;
  post.tags = req.body.tags ? parseTags(req.body.tags) : post.tags;
  post.status = req.body.status || post.status;
  post.readingTime = calculateReadingTime(post.content);
  await post.save();

  res.json({ post });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ErrorResponse('Post not found', 404);
  if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ErrorResponse('You can only delete your own posts', 403);
  }

  await Promise.all([
    Comment.deleteMany({ postId: post._id }),
    Like.deleteMany({ postId: post._id }),
    Bookmark.deleteMany({ postId: post._id }),
    post.deleteOne()
  ]);

  res.json({ message: 'Post deleted' });
});
