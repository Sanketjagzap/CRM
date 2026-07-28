const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');

function issueTokens(user) {
  const sessionId = crypto.randomUUID();
  const accessToken = jwt.sign({ id: String(user._id), role: user.role, email: user.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: String(user._id), sid: sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  return { sessionId, accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { issueTokens, verifyRefreshToken, hashToken };