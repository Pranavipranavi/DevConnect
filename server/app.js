import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean));

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: process.env.NODE_ENV === 'production' ? '30d' : 0
}));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 250, standardHeaders: true }));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'DevConnect' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` }));
app.use(errorMiddleware);

export default app;
