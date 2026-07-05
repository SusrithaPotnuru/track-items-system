import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import { sendEmail } from '../../services/email.service';
import { getReports } from '../../services/report.service';
import Input from '../../components/common/Input';
import Dropdown from '../../components/common/Dropdown';
import Button from '../../components/common/Button';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';

const SendReport = () => {
  const navigate = useNavigate();
  const { toast, toasts, removeToast } = useToast();
  const [reports, setReports] = useState([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { to: '', cc: '', subject: '', message: '', reportId: '' },
  });

  useEffect(() => {
    getReports({ limit: 50 }).then((r) => {
      setReports([
        { value: '', label: 'No attachment' },
        ...r.data.data.map((rep) => ({ value: rep._id, label: rep.reportName })),
      ]);
    }).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    try {
      const to = data.to.split(',').map((e) => e.trim()).filter(Boolean);
      const cc = data.cc ? data.cc.split(',').map((e) => e.trim()).filter(Boolean) : [];
      if (!to.length) { toast.error('At least one recipient is required'); return; }
      await sendEmail({ ...data, to, cc, reportId: data.reportId || undefined });
      toast.success('Email sent successfully');
      setTimeout(() => navigate('/email'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    }
  };

  return (
    <div className="max-w-lg">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/email')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title">Send Report via Email</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <Input
          label="To * (comma-separated emails)"
          placeholder="manager@company.com, director@company.com"
          error={errors.to?.message}
          {...register('to', { required: 'At least one recipient is required' })}
        />
        <Input
          label="CC (comma-separated, optional)"
          placeholder="hr@company.com"
          {...register('cc')}
        />
        <Input
          label="Subject *"
          placeholder="Weekly Report — June 2026"
          error={errors.subject?.message}
          {...register('subject', { required: 'Subject is required' })}
        />
        <Dropdown
          label="Attach Report (optional)"
          options={reports}
          placeholder="Select report"
          {...register('reportId')}
        />
        <div>
          <label className="label">Message</label>
          <textarea
            className="input-field mt-1 h-32 resize-none"
            placeholder="Add a custom message (optional)…"
            {...register('message')}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
            <FiSend className="mr-1.5" />Send Email
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/email')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default SendReport;
