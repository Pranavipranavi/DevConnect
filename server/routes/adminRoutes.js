import express from 'express';
import { deletePost } from '../controllers/postController.js';
import { deleteUser, getAnalytics, getUsers } from '../controllers/adminController.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);
router.get('/users', getUsers);
router.get('/analytics', getAnalytics);
router.delete('/user/:id', deleteUser);
router.delete('/post/:id', deletePost);

export default router;
