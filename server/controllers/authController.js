import { OAuth2Client } from 'google-auth-library';
import { body } from 'express-validator';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import generateToken from '../utils/generateToken.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendAuth = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.status(statusCode).json({ token, user });
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
  if (exists) throw new ErrorResponse('Email already registered', 409);

  const user = await User.create({ name, email, password });
  sendAuth(res, user.toObject(), 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ErrorResponse('Invalid email or password', 401);
  }

  const cleanUser = user.toObject();
  delete cleanUser.password;
  sendAuth(res, cleanUser);
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ErrorResponse('Google credential is required', 400);

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });
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

  sendAuth(res, user.toObject());
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const logout = (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};
