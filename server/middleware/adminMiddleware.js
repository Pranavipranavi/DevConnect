import ErrorResponse from '../utils/errorResponse.js';

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') throw new ErrorResponse('Admin access required', 403);
  next();
};
