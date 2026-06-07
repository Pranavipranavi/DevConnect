const errorMiddleware = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired or invalid. Please log in again.';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message || 'File upload failed';
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

export default errorMiddleware;
