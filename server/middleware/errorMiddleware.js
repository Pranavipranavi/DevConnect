const errorMiddleware = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message = duplicateField === 'email'
      ? 'An account with this email already exists. Please login.'
      : 'This record already exists';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Please login again';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'Image upload failed';
  }

  if (err.http_code || err.name === 'CloudinaryError') {
    statusCode = err.statusCode || 502;
    message = 'Image upload failed';
  }

  if (statusCode >= 500) {
    message = 'Something went wrong. Please try again.';
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

export default errorMiddleware;
