const { ApiError } = require('../utils/ApiError');

function notFound(request, response, next) {
  next(new ApiError(404, `Route not found: ${request.originalUrl}`));
}

function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || 'Internal server error'
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
  }

  response.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };