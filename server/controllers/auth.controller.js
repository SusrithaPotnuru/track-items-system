const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logAudit, auditFromReq } = require('../utils/auditHelper');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { accessToken, refreshToken, user } = await authService.login(email, password);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    logAudit({
      ...auditFromReq(req),
      action: 'LOGIN',
      module: 'auth',
      status: 'success',
      details: { email },
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
    });
    return sendSuccess(res, 'Login successful', { accessToken, user });
  } catch (err) {
    logAudit({
      ...auditFromReq(req),
      action: 'LOGIN_FAILED',
      module: 'auth',
      status: 'failure',
      details: { email, reason: err.message },
    });
    throw err;
  }
};

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return sendError(res, 'No refresh token', 401);
  const result = await authService.refreshAccessToken(token);
  return sendSuccess(res, 'Token refreshed', result);
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  logAudit({
    ...auditFromReq(req),
    action: 'LOGOUT',
    module: 'auth',
    status: 'success',
    details: { userId: req.user?.id },
  });
  return sendSuccess(res, 'Logged out successfully');
};

const getProfile = async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, 'Profile fetched', user);
};

const updateProfile = async (req, res) => {
  const updated = await authService.updateProfile(req.user.id, req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'UPDATE',
    module: 'profile',
    status: 'success',
    details: { fields: Object.keys(req.body) },
  });
  return sendSuccess(res, 'Profile updated', updated);
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    logAudit({
      ...auditFromReq(req),
      action: 'PASSWORD_CHANGED',
      module: 'auth',
      status: 'success',
    });
    return sendSuccess(res, 'Password changed successfully');
  } catch (err) {
    logAudit({
      ...auditFromReq(req),
      action: 'PASSWORD_CHANGED',
      module: 'auth',
      status: 'failure',
      details: { reason: err.message },
    });
    throw err;
  }
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  logAudit({
    ...auditFromReq(req),
    action: 'FORGOT_PASSWORD',
    module: 'auth',
    status: 'info',
    details: { email: req.body.email },
  });
  return sendSuccess(res, 'If that email exists, a reset link has been sent');
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  logAudit({
    ...auditFromReq(req),
    action: 'RESET_PASSWORD',
    module: 'auth',
    status: 'success',
  });
  return sendSuccess(res, 'Password reset successful');
};

const uploadProfilePhoto = async (req, res) => {
  if (!req.file) { const e = new Error('No file uploaded'); e.statusCode = 400; throw e; }
  const photoPath = `/uploads/profiles/${req.file.filename}`;
  await authService.updateProfile(req.user.id, { profilePicture: photoPath });
  logAudit({
    ...auditFromReq(req),
    action: 'UPDATE',
    module: 'profile',
    status: 'success',
    details: { field: 'profilePicture' },
  });
  return sendSuccess(res, 'Profile photo updated', { profilePicture: photoPath });
};

module.exports = { login, refreshToken, logout, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, uploadProfilePhoto };
