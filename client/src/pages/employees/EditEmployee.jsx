import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getEmployee, updateEmployee } from '../../services/employee.service';
import { getDepartments } from '../../services/department.service';
import Input from '../../components/common/Input';
import Dropdown from '../../components/common/Dropdown';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    Promise.all([getEmployee(id), getDepartments({ limit: 100, status: 'active' })]).then(
      ([empRes, deptRes]) => {
        const emp = empRes.data.data;
        reset({
          ...emp,
          department: emp.department?._id,
          joiningDate: emp.joiningDate?.split('T')[0],
        });
        setDepartments(deptRes.data.data.map((d) => ({ value: d._id, label: d.name })));
        setLoading(false);
      }
    );
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      setError('');
      await updateEmployee(id, data);
      navigate('/employees');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-6">Edit Employee</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Employee ID *"
            error={errors.employeeId?.message}
            {...register('employeeId', { required: 'Employee ID is required' })}
          />
          <Input
            label="Full Name *"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email *"
            type="email"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Phone"
            {...register('phone')}
          />
          <Dropdown
            label="Department *"
            options={departments}
            error={errors.department?.message}
            {...register('department', { required: 'Department is required' })}
          />
          <Input
            label="Designation *"
            error={errors.designation?.message}
            {...register('designation', { required: 'Designation is required' })}
          />
          <Input
            label="Joining Date *"
            type="date"
            error={errors.joiningDate?.message}
            {...register('joiningDate', { required: 'Joining date is required' })}
          />
          <Dropdown
            label="Status"
            placeholder={null}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            {...register('status')}
          />
          <Input
            label="Daily Target (items)"
            type="number"
            {...register('dailyTarget', { valueAsNumber: true })}
          />
          <Input
            label="Weekly Target (items)"
            type="number"
            {...register('weeklyTarget', { valueAsNumber: true })}
          />
          <Input
            label="Monthly Target (items)"
            type="number"
            {...register('monthlyTarget', { valueAsNumber: true })}
          />
        </div>
        <Input label="Address" {...register('address')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            {...register('notes')}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default EditEmployee;
