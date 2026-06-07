import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

export const protect = asyncHandler(async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) throw new ErrorResponse('Authentication required', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ErrorResponse('Session expired or invalid. Please log in again.', 401);
  }
  const user = await User.findById(decoded.id).select('-password');
  if (!user) throw new ErrorResponse('User no longer exists', 401);

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    req.user = null;
  }

  next();
});
