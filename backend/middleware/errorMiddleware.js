// Fallback for requests to routes that don't exist (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Interceptor
export const errorHandler = (err, req, res, next) => {
  // If the status code is still 200, force it to 500 (Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose bad ObjectId errors nicely
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found. Invalid ID format.';
    statusCode = 404;
  }

  res.status(statusCode).json({
    message,
    // Hide the stack trace in production for security
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};