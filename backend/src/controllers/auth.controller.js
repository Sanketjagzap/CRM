const crypto = require('crypto');
const { User } = require('../models/User');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { issueTokens, verifyRefreshToken, hashToken } = require('../services/token.service');

function setAuthCookies(response, accessToken, refreshToken) {
  response.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 15 * 60 * 1000 });
  response.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

const register = asyncHandler(async (request, response) => {
  const { name, email, password, role } = request.body;
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, 'Email already in use');
  }

  const user = new User({ name, email, role: role || 'sales' });
  await user.setPassword(password);
  await user.save();

  const { accessToken, refreshToken, sessionId } = issueTokens(user);
  user.refreshSessions.push({ sid: sessionId, userAgent: request.headers['user-agent'] || '', ip: request.ip || '', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await user.save();
  setAuthCookies(response, accessToken, refreshToken);

  response.status(201).json({ success: true, data: user.toSafeJSON(), accessToken, refreshToken });
});

const login = asyncHandler(async (request, response) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken, sessionId } = issueTokens(user);
  user.lastLoginAt = new Date();
  user.refreshSessions.push({ sid: sessionId, userAgent: request.headers['user-agent'] || '', ip: request.ip || '', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await user.save();
  setAuthCookies(response, accessToken, refreshToken);

  response.json({ success: true, data: user.toSafeJSON(), accessToken, refreshToken });
});

const refresh = asyncHandler(async (request, response) => {
  const incoming = request.body.refreshToken || request.cookies?.refreshToken;
  if (!incoming) {
    throw new ApiError(401, 'Refresh token required');
  }

  const decoded = verifyRefreshToken(incoming);
  const user = await User.findById(decoded.id).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const session = user.refreshSessions.find((item) => item.sid === decoded.sid && !item.revokedAt);
  if (!session) {
    throw new ApiError(401, 'Session expired');
  }

  session.revokedAt = new Date();
  const { accessToken, refreshToken, sessionId } = issueTokens(user);
  user.refreshSessions.push({ sid: sessionId, userAgent: request.headers['user-agent'] || '', ip: request.ip || '', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await user.save();

  setAuthCookies(response, accessToken, refreshToken);
  response.json({ success: true, accessToken, refreshToken });
});

const logout = asyncHandler(async (request, response) => {
  const incoming = request.body.refreshToken || request.cookies?.refreshToken;
  if (incoming) {
    try {
      const decoded = verifyRefreshToken(incoming);
      const user = await User.findById(decoded.id);
      if (user) {
        const session = user.refreshSessions.find((item) => item.sid === decoded.sid && !item.revokedAt);
        if (session) {
          session.revokedAt = new Date();
          await user.save();
        }
      }
    } catch (error) {
      // ignore invalid token on logout
    }
  }

  response.clearCookie('accessToken');
  response.clearCookie('refreshToken');
  response.json({ success: true, message: 'Logged out' });
});

const forgotPassword = asyncHandler(async (request, response) => {
  const user = await User.findOne({ email: request.body.email });
  if (!user) {
    return response.json({ success: true, message: 'If the email exists, a reset link was sent' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  response.json({ success: true, message: 'Reset token generated for local development', resetToken });
});

const resetPassword = asyncHandler(async (request, response) => {
  const { token, password } = request.body;
  const tokenHash = hashToken(token);
  const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } }).select('+passwordHash');
  if (!user) {
    throw new ApiError(400, 'Reset token invalid or expired');
  }

  await user.setPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.refreshSessions = [];
  await user.save();

  response.json({ success: true, message: 'Password updated' });
});

const me = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id);
  response.json({ success: true, data: user?.toSafeJSON() });
});

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, me };