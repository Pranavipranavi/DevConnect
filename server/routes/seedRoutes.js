import express from 'express';
import { seedDemo } from '../controllers/seedController.js';

const router = express.Router();

router.post('/demo', seedDemo);

export default router;
