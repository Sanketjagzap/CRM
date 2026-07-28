const { asyncHandler } = require('../utils/asyncHandler');
const { User } = require('../models/User');
const { ApiError } = require('../utils/ApiError');

const updateProfile = asyncHandler(async (request, response) => {
  const user = await User.findByIdAndUpdate(request.user.id, request.body, { new: true, runValidators: true });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  response.json({ success: true, data: user.toSafeJSON() });
});

module.exports = { updateProfile };