import express from 'express';
import { getMe, googleLogin, login, loginRules, logout, refresh, register, registerRules } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.post('/refresh', protect, refresh);
router.post('/logout', logout);

export default router;
