const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sessionSchema = new mongoose.Schema(
  {
    sid: { type: String, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'manager', 'sales', 'support'], default: 'sales', index: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    title: { type: String, default: '' },
    department: { type: String, default: '' },
    status: { type: String, enum: ['active', 'invited', 'disabled'], default: 'active' },
    refreshSessions: { type: [sessionSchema], default: [] },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.passwordResetTokenHash;
  delete user.passwordResetExpiresAt;
  delete user.refreshSessions;
  return { ...user, isActive: user.status !== 'disabled' && user.status !== 'invited' };
};

const User = mongoose.model('User', userSchema);

module.exports = { User };