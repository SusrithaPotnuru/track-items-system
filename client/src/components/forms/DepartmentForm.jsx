import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Button from '../common/Button';

const DepartmentForm = ({ onSubmit, onCancel, defaultValues, loading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });

  useEffect(() => {
    reset(defaultValues || { status: 'active' });
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Department Name *"
        placeholder="e.g. Engineering, Human Resources"
        error={errors.name?.message}
        {...register('name', { required: 'Department name is required' })}
      />
      <Input
        label="Code *"
        placeholder="e.g. ENG, HR, FIN"
        className="uppercase"
        error={errors.code?.message}
        {...register('code', {
          required: 'Department code is required',
          setValueAs: (v) => v?.toUpperCase().trim() || '',
        })}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          rows={3}
          placeholder="Optional description..."
          className="input-field resize-none"
          {...register('description')}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
        <select className="input-field" {...register('status')}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Save Department
        </Button>
      </div>
    </form>
  );
};

export default DepartmentForm;
