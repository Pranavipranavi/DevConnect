import express from 'express';
import { commentRules, createComment, deleteComment, getComments } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/', protect, commentRules, validate, createComment);
router.get('/:postId', getComments);
router.delete('/:id', protect, deleteComment);

export default router;
