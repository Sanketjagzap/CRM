const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { User } = require('../models/User');
const { getPagination } = require('../utils/paginate');

const listUsers = asyncHandler(async (request, response) => {
  const { page, limit, skip } = getPagination(request.query);
  const search = String(request.query.search || '').trim();
  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: items.map((user) => {
      delete user.passwordHash;
      delete user.passwordResetTokenHash;
      delete user.passwordResetExpiresAt;
      delete user.refreshSessions;
      return { ...user, isActive: user.status !== 'disabled' && user.status !== 'invited' };
    }),
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
  });
});

const createUser = asyncHandler(async (request, response) => {
  const { name, email, password, role = 'sales', phone = '', title = '', department = '' } = request.body;
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, 'Email already in use');
  }

  const user = new User({ name, email, role, phone, title, department });
  await user.setPassword(password);
  await user.save();

  response.status(201).json({ success: true, data: user.toSafeJSON() });
});

const updateUser = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { name, email, password, role, phone, title, department, isActive } = request.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      throw new ApiError(409, 'Email already in use');
    }
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (phone !== undefined) user.phone = phone || '';
  if (title !== undefined) user.title = title || '';
  if (department !== undefined) user.department = department || '';

  if (isActive !== undefined) {
    if (user.status === 'invited') {
      user.status = isActive ? 'active' : 'invited';
    } else {
      user.status = isActive ? 'active' : 'disabled';
    }
  }

  if (password && password.trim() !== '') {
    await user.setPassword(password);
  }

  await user.save();
  response.json({ success: true, data: user.toSafeJSON() });
});

const deleteUser = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (String(request.user._id) === String(id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  response.json({ success: true, message: 'User deleted successfully' });
});

module.exports = { listUsers, createUser, updateUser, deleteUser };
