import { validationResult } from 'express-validator';
import ErrorResponse from '../utils/errorResponse.js';

export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ErrorResponse(errors.array().map((error) => error.msg).join(', '), 400);
  }
  next();
};
