import express from 'express';
import { getMyBookmarks, toggleBookmark } from '../controllers/bookmarkController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyBookmarks);
router.post('/:postId', protect, toggleBookmark);

export default router;
