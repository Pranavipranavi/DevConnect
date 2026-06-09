import { OAuth2Client } from 'google-auth-library';
import { body } from 'express-validator';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import generateToken from '../utils/generateToken.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (user) => {
  const cleanUser = user.toObject ? user.toObject() : { ...user };
  delete cleanUser.password;
  return cleanUser;
};

const sendAuth = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.status(statusCode).json({ token, user: sanitizeUser(user) });
};

export const registerRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ErrorResponse('An account with this email already exists. Please login.', 409);

  try {
    const user = await User.create({ name, email, password });
    sendAuth(res, user, 201);
  } catch (error) {
    if (error.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) {
      throw new ErrorResponse('An account with this email already exists. Please login.', 409);
    }
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ErrorResponse('Invalid email or password', 401);
  }

  sendAuth(res, user);
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!process.env.GOOGLE_CLIENT_ID) throw new ErrorResponse('Google sign-in is not configured', 503);
  if (!credential) throw new ErrorResponse('Google credential is required', 400);

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
  } catch {
    throw new ErrorResponse('Invalid Google credential', 401);
  }
  const payload = ticket.getPayload();

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      avatar: payload.picture,
      googleId: payload.sub
    });
  }

  sendAuth(res, user);
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const refresh = asyncHandler(async (req, res) => {
  sendAuth(res, req.user);
});

export const logout = (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};
