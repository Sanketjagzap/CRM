const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { SystemSetting, DEFAULT_SETTINGS } = require('../models/SystemSetting');
const { User } = require('../models/User');
const bcrypt = require('bcryptjs');

const getSettings = asyncHandler(async (request, response) => {
  const adminOnly = ['users_management', 'permissions'];
  const settings = await SystemSetting.find({}).lean();
  const result = {};
  settings.forEach((s) => (result[s.key] = s.value));
  for (const def of DEFAULT_SETTINGS) {
    if (!(def.key in result)) result[def.key] = def.value;
  }
  response.json({ success: true, data: result });
});

const updateSetting = asyncHandler(async (request, response) => {
  const { key, value } = request.body;
  if (!key) throw new ApiError(400, 'Key is required');
  if (['deal_stages', 'lead_statuses', 'tax_rate', 'currency', 'currency_symbol'].includes(key) &&
      request.user.role !== 'admin' && request.user.role !== 'manager') {
    throw new ApiError(403, 'Admin or Manager role required');
  }
  const setting = await SystemSetting.findOneAndUpdate(
    { key },
    { value, updatedBy: request.user.id },
    { upsert: true, new: true }
  );
  response.json({ success: true, data: { key: setting.key, value: setting.value } });
});

const updateBulk = asyncHandler(async (request, response) => {
  const { updates } = request.body;
  if (!updates || typeof updates !== 'object') throw new ApiError(400, 'updates object required');
  const result = [];
  for (const [key, value] of Object.entries(updates)) {
    const s = await SystemSetting.findOneAndUpdate(
      { key },
      { value, updatedBy: request.user.id },
      { upsert: true, new: true }
    );
    result.push({ key: s.key, value: s.value });
  }
  response.json({ success: true, data: result });
});

const getProfile = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id).select('-passwordHash -passwordResetTokenHash -passwordResetExpiresAt -refreshSessions');
  if (!user) throw new ApiError(404, 'User not found');
  response.json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (request, response) => {
  const { name, phone, title, department, avatar } = request.body;
  const user = await User.findByIdAndUpdate(
    request.user.id,
    { name, phone, title, department, avatar },
    { new: true, runValidators: true }
  ).select('-passwordHash -passwordResetTokenHash -passwordResetExpiresAt -refreshSessions');
  if (!user) throw new ApiError(404, 'User not found');
  response.json({ success: true, data: user });
});

const changePassword = asyncHandler(async (request, response) => {
  const { currentPassword, newPassword } = request.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Current and new passwords required');
  if (newPassword.length < 6) throw new ApiError(400, 'New password must be at least 6 characters');
  const user = await User.findById(request.user.id).select('+passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new ApiError(401, 'Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  response.json({ success: true, message: 'Password updated' });
});

module.exports = { getSettings, updateSetting, updateBulk, getProfile, updateProfile, changePassword };
