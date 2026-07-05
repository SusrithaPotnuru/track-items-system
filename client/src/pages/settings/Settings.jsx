import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  getSettings, updateGeneral, updateSmtp, updateProductivity,
  updateSecurity, updateScheduler, testSmtp, uploadLogo,
} from '../../services/settings.service';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import PasswordInput from '../../components/common/PasswordInput';
import useToast from '../../hooks/useToast';
import { useTheme } from '../../context/ThemeContext';

const SERVER_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api.*$/, '');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY'];
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MMM DD, YYYY'];
const TIMEZONES = [
  'Asia/Kolkata', 'UTC', 'America/New_York', 'America/Chicago',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
  'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney',
];
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'smtp', label: 'SMTP / Email' },
  { id: 'security', label: 'Security' },
  { id: 'scheduler', label: 'Scheduler' },
];

const ToastList = ({ toasts, remove }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 w-80 pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id} onClick={() => remove(t.id)}
        className={`flex items-center gap-3 p-4 rounded-xl shadow-lg cursor-pointer border text-sm font-medium pointer-events-auto
          ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300' : ''}
          ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300' : ''}
          ${t.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300' : ''}`}>
        <span className="text-base">{t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}</span>
        <span className="flex-1">{t.message}</span>
      </div>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">{children}</h3>
);

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    {children}{required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const InputField = ({ label, required, className = '', ...props }) => (
  <div>
    {label && <Label required={required}>{label}</Label>}
    <input className={`input-field text-sm ${className}`} {...props} />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div>
    {label && <Label>{label}</Label>}
    <select className="input-field text-sm" {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-start gap-3">
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
  </div>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [weekOffDays, setWeekOffDays] = useState([0, 6]);
  const [managerEmails, setManagerEmails] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoRef = useRef();
  const { toasts, toast, removeToast } = useToast();
  const { dark, toggleTheme } = useTheme();
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  useEffect(() => {
    getSettings()
      .then((r) => {
        const s = r.data.data;
        reset(s);
        setWeekOffDays(s.weekOffDays || [0, 6]);
        setManagerEmails(Array.isArray(s.managerEmails) ? s.managerEmails.join(', ') : '');
        setLogoPreview(s.companyLogo ? `${SERVER_ORIGIN}${s.companyLogo}` : null);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const makeSave = (fn, section) => async (data) => {
    setSaving(true);
    try {
      if (section === 'general' && logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        await uploadLogo(fd);
        setLogoFile(null);
      }
      if (section === 'productivity') {
        data.weekOffDays = weekOffDays;
        data.managerEmails = managerEmails.split(',').map((e) => e.trim()).filter(Boolean);
      }
      await fn(data);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    try {
      await testSmtp();
      toast.success('SMTP connection successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'SMTP connection failed');
    } finally {
      setTesting(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const toggleWeekOff = (day) => {
    setWeekOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  if (loading) return <Loader />;

  const schEnabled = !!watch('schedulerEnabled');
  const dailyRemEnabled = !!watch('dailyReminderEnabled');
  const pendingApprovalEnabled = !!watch('pendingApprovalEnabled');
  const pwdMinLen = watch('passwordMinLength') || 8;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} remove={removeToast} />

      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage company configuration, SMTP, security, and scheduler settings
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-6">

        {/* ── GENERAL ── */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit(makeSave(updateGeneral, 'general'))} className="space-y-6">
            <SectionTitle>Company Identity</SectionTitle>

            {/* Logo upload */}
            <div>
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => logoRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-primary-400 transition">
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    : <div className="text-center"><div className="text-2xl">🏢</div><p className="text-xs text-gray-400 mt-1">Upload</p></div>}
                </div>
                <div className="space-y-1">
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition">
                    Choose Image
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500">JPEG, PNG, or WebP · max 5 MB</p>
                  {logoFile && <p className="text-xs text-primary-600 dark:text-primary-400">{logoFile.name}</p>}
                </div>
                <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Company Name" {...register('companyName')} />
              <InputField label="Company Email" type="email" {...register('companyEmail')} />
              <InputField label="Company Phone" {...register('companyPhone')} />
              <InputField label="Company Address" {...register('companyAddress')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField label="Timezone" {...register('timezone')}
                options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))} />
              <SelectField label="Currency" {...register('currency')}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
              <SelectField label="Date Format" {...register('dateFormat')}
                options={DATE_FORMATS.map((f) => ({ value: f, label: f }))} />
            </div>

            {/* Appearance */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
              <SectionTitle>Appearance</SectionTitle>
              <Toggle
                label={`Dark Mode ${dark ? '(On)' : '(Off)'}`}
                description="Switch between light and dark interface theme"
                checked={dark}
                onChange={toggleTheme}
              />
            </div>

            <Button type="submit" loading={saving}>Save General Settings</Button>
          </form>
        )}

        {/* ── PRODUCTIVITY ── */}
        {activeTab === 'productivity' && (
          <form onSubmit={handleSubmit(makeSave(updateProductivity, 'productivity'))} className="space-y-6">
            <SectionTitle>Productivity Targets</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Daily Target (items)" type="number" min="1" {...register('dailyTarget')} />
              <InputField label="Weekly Target (items)" type="number" min="1" {...register('weeklyTarget')} />
              <InputField label="Monthly Target (items)" type="number" min="1" {...register('monthlyTarget')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Default Working Hours / Day" type="number" min="1" max="24" step="0.5" {...register('defaultWorkingHours')} />
              <SelectField label="Default Report Format" {...register('defaultReportFormat')}
                options={[{ value: 'pdf', label: 'PDF' }, { value: 'excel', label: 'Excel' }, { value: 'csv', label: 'CSV' }]} />
            </div>

            {/* Working days */}
            <div>
              <SectionTitle>Working Days</SectionTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Mark a day as <span className="text-red-600 font-medium">Week-off</span> (red) or <span className="text-green-600 font-medium">Working</span> (green). Click to toggle.
              </p>
              <div className="flex gap-2 flex-wrap">
                {DAY_NAMES.map((day, idx) => {
                  const isOff = weekOffDays.includes(idx);
                  return (
                    <button key={day} type="button" onClick={() => toggleWeekOff(idx)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all select-none ${
                        isOff
                          ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400'
                          : 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                      }`}>
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <p>Working days: <span className="text-green-700 dark:text-green-400 font-medium">{DAY_NAMES.filter((_, i) => !weekOffDays.includes(i)).join(', ') || 'None'}</span></p>
                <p>Week-offs: <span className="text-red-600 dark:text-red-400 font-medium">{DAY_NAMES.filter((_, i) => weekOffDays.includes(i)).join(', ') || 'None'}</span></p>
              </div>
            </div>

            {/* Manager emails */}
            <div>
              <Label>Manager Email Recipients</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Comma-separated — these addresses receive automated reports</p>
              <textarea
                value={managerEmails}
                onChange={(e) => setManagerEmails(e.target.value)}
                rows={2}
                placeholder="manager@company.com, lead@company.com"
                className="input-field text-sm resize-none" />
            </div>

            <Button type="submit" loading={saving}>Save Productivity Settings</Button>
          </form>
        )}

        {/* ── SMTP ── */}
        {activeTab === 'smtp' && (
          <form onSubmit={handleSubmit(makeSave(updateSmtp, 'smtp'))} className="space-y-5">
            <SectionTitle>SMTP Server Configuration</SectionTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="SMTP Host" placeholder="smtp.gmail.com" {...register('smtpHost')} />
              <InputField label="SMTP Port" type="number" placeholder="587" {...register('smtpPort')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Username / Email" {...register('smtpUsername')} />
              <PasswordInput label="Password" placeholder="Leave blank to keep current" {...register('smtpPassword')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Sender Email" type="email" {...register('senderEmail')} />
              <InputField label="Sender Display Name" {...register('senderName')} />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
              Common ports: <strong>587</strong> (STARTTLS) · <strong>465</strong> (SSL) · <strong>25</strong> (unencrypted)
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={saving}>Save SMTP Settings</Button>
              <button type="button" onClick={handleTestSmtp} disabled={testing}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition disabled:opacity-50">
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </form>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <form onSubmit={handleSubmit(makeSave(updateSecurity, 'security'))} className="space-y-6">
            <SectionTitle>Session & Access Control</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Session Timeout (minutes)" type="number" min="1" {...register('sessionTimeout')} />
              <InputField label="Max Login Attempts" type="number" min="1" {...register('maxLoginAttempts')} />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
              <SectionTitle>Password Policy</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Minimum Password Length" type="number" min="6" max="32" {...register('passwordMinLength')} />
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Current Password Requirements</p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5 list-disc list-inside">
                  <li>Minimum {pwdMinLen} characters</li>
                  <li>At least one uppercase letter (A–Z)</li>
                  <li>At least one number (0–9)</li>
                  <li>At least one special character (!@#$%^&*)</li>
                </ul>
              </div>
            </div>

            <Button type="submit" loading={saving}>Save Security Settings</Button>
          </form>
        )}

        {/* ── SCHEDULER ── */}
        {activeTab === 'scheduler' && (
          <form onSubmit={handleSubmit(makeSave(updateScheduler, 'scheduler'))} className="space-y-6">
            <SectionTitle>Report Scheduler</SectionTitle>

            <Toggle
              label="Enable Automatic Report Scheduler"
              description="Automatically generate and email reports on a schedule"
              checked={schEnabled}
              onChange={(v) => setValue('schedulerEnabled', v)}
            />

            {schEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-14">
                <SelectField label="Frequency" {...register('schedulerFrequency')}
                  options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} />
                <InputField label="Time (HH:MM)" placeholder="08:00" {...register('schedulerTime')} />
                <InputField label="Day (0=Sun … 6=Sat or 1–31)" type="number" min="0" max="31" {...register('schedulerDay')} />
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
              <SectionTitle>Reminders</SectionTitle>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                  <Toggle
                    label="Daily Entry Reminder"
                    description="Remind employees to submit their daily productivity entries"
                    checked={dailyRemEnabled}
                    onChange={(v) => setValue('dailyReminderEnabled', v)}
                  />
                  {dailyRemEnabled && (
                    <div className="pl-14">
                      <InputField label="Reminder Time" placeholder="09:00" {...register('dailyReminderTime')} />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Toggle
                    label="Pending Approval Reminder"
                    description="Remind managers about entries awaiting approval"
                    checked={pendingApprovalEnabled}
                    onChange={(v) => setValue('pendingApprovalEnabled', v)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" loading={saving}>Save Scheduler Settings</Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settings;
