import multer from 'multer';
import ErrorResponse from '../utils/errorResponse.js';

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new ErrorResponse('Only image uploads are allowed', 400), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }
});
