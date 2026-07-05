import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword, uploadProfilePhoto } from '../../services/auth.service';
import Button from '../../components/common/Button';
import PasswordInput from '../../components/common/PasswordInput';
import useToast from '../../hooks/useToast';

const SERVER_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api.*$/, '');

const TABS = [
  { id: 'profile', label: 'Edit Profile' },
  { id: 'password', label: 'Change Password' },
  { id: 'session', label: 'Session Info' },
];

const ToastList = ({ toasts, remove }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 w-80 pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id} onClick={() => remove(t.id)}
        className={`flex items-center gap-3 p-4 rounded-xl shadow-lg cursor-pointer border text-sm font-medium pointer-events-auto
          ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300' : ''}
          ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300' : ''}`}>
        <span>{t.type === 'success' ? '✓' : '✗'}</span>
        <span className="flex-1">{t.message}</span>
      </div>
    ))}
  </div>
);

const InfoRow = ({ label, value, highlight }) => (
  <div className={`flex justify-between items-center px-4 py-3 rounded-xl ${highlight || 'bg-gray-50 dark:bg-gray-800/50'}`}>
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
  </div>
);

const getTokenInfo = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch { return null; }
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [photoPreview, setPhotoPreview] = useState(
    user?.profilePicture ? `${SERVER_ORIGIN}${user.profilePicture}` : null
  );
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef();
  const { toasts, toast, removeToast } = useToast();

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    formState: { isSubmitting: savingProfile },
  } = useForm({
    defaultValues: { fullName: user?.fullName, phone: user?.phone || '', address: user?.address || '' },
  });

  const {
    register: regPwd,
    handleSubmit: submitPwd,
    reset: resetPwd,
    watch: watchPwd,
    formState: { isSubmitting: savingPwd, errors: errPwd },
  } = useForm();

  const onSaveProfile = async (data) => {
    try {
      const res = await updateProfile(data);
      setUser((u) => ({ ...u, ...res.data.data }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const onChangePassword = async (data) => {
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      resetPwd();
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await uploadProfilePhoto(fd);
      const photoPath = res.data.data.profilePicture;
      setUser((u) => ({ ...u, profilePicture: photoPath }));
      setPhotoPreview(`${SERVER_ORIGIN}${photoPath}`);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
      setPhotoPreview(user?.profilePicture ? `${SERVER_ORIGIN}${user.profilePicture}` : null);
    } finally {
      setUploading(false);
    }
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const tokenInfo = getTokenInfo();
  const newPwd = watchPwd('newPassword');

  return (
    <div className="max-w-xl space-y-6">
      <ToastList toasts={toasts} remove={removeToast} />

      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account, password, and session settings
        </p>
      </div>

      {/* Identity card */}
      <div className="card p-5 flex items-center gap-5">
        {/* Avatar with upload overlay */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-2xl text-primary-700 dark:text-primary-300">
            {photoPreview
              ? <img src={photoPreview} alt={user?.fullName} className="w-full h-full object-cover" />
              : initials}
          </div>
          <button
            type="button"
            onClick={() => !uploading && photoRef.current?.click()}
            title="Upload profile photo"
            className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-md transition text-xs disabled:opacity-50">
            {uploading ? '…' : '📷'}
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* User info */}
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
              user?.role === 'admin'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            }`}>
              {user?.role?.toUpperCase()}
            </span>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              Active
            </span>
          </div>
          {user?.lastLogin && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Last login: {new Date(user.lastLogin).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-6">

        {/* ── EDIT PROFILE ── */}
        {tab === 'profile' && (
          <form onSubmit={submitProfile(onSaveProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input {...regProfile('fullName')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-gray-400 text-xs">(read-only)</span></label>
              <input
                value={user?.email || ''}
                readOnly
                className="input-field opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input {...regProfile('phone')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <textarea {...regProfile('address')} rows={2} className="input-field resize-none" />
            </div>
            <Button type="submit" loading={savingProfile}>Save Changes</Button>
          </form>
        )}

        {/* ── CHANGE PASSWORD ── */}
        {tab === 'password' && (
          <form onSubmit={submitPwd(onChangePassword)} className="space-y-4">
            <PasswordInput
              label="Current Password"
              error={errPwd.currentPassword?.message}
              {...regPwd('currentPassword', { required: 'Current password is required' })}
            />
            <PasswordInput
              label="New Password"
              error={errPwd.newPassword?.message}
              {...regPwd('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
                  message: 'Must contain uppercase, number, and special character',
                },
              })}
            />
            <PasswordInput
              label="Confirm New Password"
              error={errPwd.confirmPassword?.message}
              {...regPwd('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === newPwd || 'Passwords do not match',
              })}
            />

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Password requirements: uppercase letter · number · special character (!@#$%^&*) · minimum 8 characters
              </p>
            </div>

            <Button type="submit" loading={savingPwd}>Change Password</Button>
          </form>
        )}

        {/* ── SESSION INFO ── */}
        {tab === 'session' && (
          <div className="space-y-3">
            <InfoRow label="Account Email" value={user?.email || '—'} />
            <InfoRow label="Role" value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || '—'} />
            <InfoRow label="Account Status" value="Active"
              highlight="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" />

            {user?.lastLogin ? (
              <InfoRow label="Last Login" value={new Date(user.lastLogin).toLocaleString()} />
            ) : (
              <InfoRow label="Last Login" value="Not recorded yet" />
            )}

            {tokenInfo && (
              <>
                <InfoRow label="Session Started" value={tokenInfo.issuedAt.toLocaleString()} />
                <div className={`flex justify-between items-center px-4 py-3 rounded-xl ${
                  tokenInfo.expiresAt < new Date()
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Token Expires</span>
                  <span className={`text-sm font-medium ${tokenInfo.expiresAt < new Date() ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {tokenInfo.expiresAt.toLocaleString()}
                  </span>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Access tokens auto-refresh via the secure refresh-token cookie. Your session stays active until you log out or the refresh token expires (7 days).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
