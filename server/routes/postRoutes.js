import express from 'express';
import { createPost, deletePost, getPost, getPosts, postRules, updatePost } from '../controllers/postController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', protect, upload.single('coverImage'), postRules, validate, createPost);
router.put('/:id', protect, upload.single('coverImage'), postRules, validate, updatePost);
router.delete('/:id', protect, deletePost);

export default router;
