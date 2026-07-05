const crypto = require('crypto');
const User = require('../models/User.model');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { createTransporter } = require('../config/nodemailer');
const Settings = require('../models/Settings.model');

const login = async (email, password) => {
  const user = await User.findOne({ email, status: 'active' }).select('+password');
  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const match = await user.comparePassword(password);
  if (!match) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  const payload = { id: user._id, email: user.email, role: user.role, fullName: user.fullName };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, profilePicture: user.profilePicture, lastLogin: new Date() } };
};

const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role, fullName: decoded.fullName };
    return { accessToken: signAccessToken(payload) };
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }
};

const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

const updateProfile = async (userId, data) => {
  const allowed = ['fullName', 'phone', 'address', 'profilePicture'];
  const update = {};
  allowed.forEach((k) => { if (data[k] !== undefined) update[k] = data[k]; });
  return User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).select('-password');
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const match = await user.comparePassword(currentPassword);
  if (!match) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  user.password = newPassword;
  await user.save();
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return; // Don't reveal if email exists

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save();

  const settings = await Settings.findOne();
  if (settings?.smtpHost) {
    const transporter = createTransporter(settings);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"${settings.senderName}" <${settings.senderEmail}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click below to reset your password (expires in 30 minutes):</p><a href="${resetUrl}">${resetUrl}</a>`,
    });
  }

  return token;
};

const resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

module.exports = { login, refreshAccessToken, getProfile, updateProfile, changePassword, forgotPassword, resetPassword };
