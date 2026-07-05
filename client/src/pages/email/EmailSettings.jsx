import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiMail, FiPlay, FiRefreshCw, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { getSettings, updateSmtp, updateScheduler } from '../../services/settings.service';
import { sendTestEmail, getSchedulerStatus, toggleScheduler, runSchedulerJob } from '../../services/email.service';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PasswordInput from '../../components/common/PasswordInput';
import Badge from '../../components/common/Badge';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';

const SectionCard = ({ title, children }) => (
  <div className="card p-6 space-y-4">
    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-3">{title}</h2>
    {children}
  </div>
);

const SmtpForm = ({ settings, onSaved }) => {
  const { toast, toasts, removeToast } = useToast();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      smtpHost: settings?.smtpHost || '',
      smtpPort: settings?.smtpPort || 587,
      smtpUsername: settings?.smtpUsername || '',
      smtpPassword: '',
      senderEmail: settings?.senderEmail || '',
      senderName: settings?.senderName || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };
      if (!payload.smtpPassword) delete payload.smtpPassword;
      await updateSmtp(payload);
      toast.success('SMTP settings saved');
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save SMTP settings');
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="SMTP Host" placeholder="smtp.gmail.com" error={errors.smtpHost?.message} {...register('smtpHost')} />
          <Input label="Port" type="number" placeholder="587" error={errors.smtpPort?.message} {...register('smtpPort', { valueAsNumber: true })} />
          <Input label="Username" placeholder="noreply@company.com" {...register('smtpUsername')} />
          <PasswordInput label="Password" placeholder="Leave blank to keep current" {...register('smtpPassword')} />
          <Input label="Sender Email" type="email" placeholder="noreply@company.com" error={errors.senderEmail?.message} {...register('senderEmail')} />
          <Input label="Sender Name" placeholder="Timesheet System" {...register('senderName')} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={isSubmitting}>Save SMTP</Button>
        </div>
      </form>
    </>
  );
};

const TestEmailForm = ({ settings }) => {
  const { toast, toasts, removeToast } = useToast();
  const [testing, setTesting] = useState(false);
  const [validating, setValidating] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: settings?.senderEmail || '' },
  });

  const handleTest = async (data) => {
    try {
      setTesting(true);
      await sendTestEmail(data.email);
      toast.success(`Test email sent to ${data.email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test email failed');
    } finally {
      setTesting(false);
    }
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      await import('../../services/email.service').then((m) => m.validateSmtp());
      toast.success('SMTP connection verified successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'SMTP connection failed');
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <form onSubmit={handleSubmit(handleTest)} className="space-y-4">
        <Input label="Send Test Email To" type="email" placeholder="you@example.com" error={errors.email?.message}
          {...register('email', { required: 'Email required' })} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={testing} variant="secondary"><FiMail className="mr-1.5" />Send Test</Button>
          <Button type="button" loading={validating} variant="secondary" onClick={handleValidate}><FiCheck className="mr-1.5" />Validate SMTP</Button>
        </div>
      </form>
    </>
  );
};

const SchedulerToggle = ({ label, jobType, enabled: initialEnabled, time, timeField, onRefresh }) => {
  const { toast, toasts, removeToast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    setEnabled(initialEnabled);
    getSchedulerStatus().then((r) => {
      const s = r.data.data;
      if (jobType === 'report') setLiveStatus(s.report?.running);
      if (jobType === 'daily-reminder') setLiveStatus(s.dailyReminder?.running);
      if (jobType === 'pending-approval') setLiveStatus(s.pendingApproval?.running);
    }).catch(() => {});
  }, [initialEnabled, jobType]);

  const handleToggle = async () => {
    try {
      setToggling(true);
      await toggleScheduler(jobType, !enabled);
      setEnabled(!enabled);
      toast.success(`${label} ${!enabled ? 'enabled' : 'disabled'}`);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      await runSchedulerJob(jobType);
      toast.success(`${label} triggered manually`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger job');
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
            <span className={`inline-block w-2 h-2 rounded-full ${liveStatus ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <Badge value={liveStatus ? 'running' : 'stopped'} />
          </div>
          {time && <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FiClock className="w-3 h-3" />{time}</p>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={enabled ? 'danger' : 'primary'} loading={toggling} onClick={handleToggle}>
            {enabled ? <><FiX className="mr-1" />Disable</> : <><FiCheck className="mr-1" />Enable</>}
          </Button>
          <Button size="sm" variant="secondary" loading={running} onClick={handleRun} disabled={!enabled}>
            <FiPlay className="mr-1" />Run Now
          </Button>
        </div>
      </div>
    </>
  );
};

const EmailSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="page-title">Email Settings</h1>
        {[1, 2, 3].map((i) => <div key={i} className="card p-6 animate-pulse h-40" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <FiMail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h1 className="page-title">Email Settings</h1>
      </div>

      <SectionCard title="SMTP Configuration">
        <SmtpForm settings={settings} onSaved={loadSettings} />
      </SectionCard>

      <SectionCard title="Test SMTP Connection">
        <p className="text-sm text-gray-500 dark:text-gray-400">Verify your SMTP configuration by sending a test email or validating the connection.</p>
        <TestEmailForm settings={settings} />
      </SectionCard>

      <SectionCard title="Scheduler Configuration">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Enable or disable automated email jobs. Changes take effect immediately without a server restart.</p>
        <div className="space-y-3">
          <SchedulerToggle
            label="Weekly / Monthly Report Scheduler"
            jobType="report"
            enabled={!!settings?.schedulerEnabled}
            time={settings?.schedulerCron ? `Cron: ${settings.schedulerCron}` : settings?.schedulerTime ? `Time: ${settings?.schedulerTime} (${settings?.schedulerFrequency})` : null}
            onRefresh={loadSettings}
          />
          <SchedulerToggle
            label="Daily Entry Reminder"
            jobType="daily-reminder"
            enabled={!!settings?.dailyReminderEnabled}
            time={settings?.dailyReminderTime ? `Runs daily at ${settings.dailyReminderTime}` : 'Runs daily at 09:00'}
            onRefresh={loadSettings}
          />
          <SchedulerToggle
            label="Pending Approval Reminder"
            jobType="pending-approval"
            enabled={!!settings?.pendingApprovalEnabled}
            time="Runs daily at 08:00"
            onRefresh={loadSettings}
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default EmailSettings;
