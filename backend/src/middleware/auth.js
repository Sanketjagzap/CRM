const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

function getToken(request) {
  const headerToken = request.headers.authorization?.replace('Bearer ', '');
  const cookieToken = request.cookies?.accessToken;
  return headerToken || cookieToken || null;
}

function authenticate(request, response, next) {
  const token = getToken(request);
  if (!token) {
    return next(new ApiError(401, 'Authentication required'));
  }

  try {
    request.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(request.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    return next();
  };
}

module.exports = { authenticate, requireRole };