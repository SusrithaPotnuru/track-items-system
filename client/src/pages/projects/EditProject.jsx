import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getProject, updateProject } from '../../services/project.service';
import { getDepartments } from '../../services/department.service';
import { getEmployees } from '../../services/employee.service';
import Input from '../../components/common/Input';
import Dropdown from '../../components/common/Dropdown';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { PROJECT_STATUS, PRIORITY } from '../../utils/constants';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    Promise.all([
      getProject(id),
      getDepartments({ limit: 100, status: 'active' }),
      getEmployees({ limit: 200, status: 'active', sortBy: 'name', sortOrder: 'asc' }),
    ]).then(([pRes, dRes, eRes]) => {
      const p = pRes.data.data;
      reset({
        ...p,
        department: p.department?._id,
        startDate: p.startDate?.split('T')[0],
        endDate: p.endDate?.split('T')[0],
        assignedEmployees: p.assignedEmployees?.map((e) => e._id) || [],
      });
      setDepartments(dRes.data.data.map((d) => ({ value: d._id, label: d.name })));
      setEmployees(eRes.data.data);
      setLoading(false);
    });
  }, [id, reset]);

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(empSearch.toLowerCase())
  );

  const onSubmit = async (data) => {
    try {
      setError('');
      const payload = {
        ...data,
        assignedEmployees: Array.isArray(data.assignedEmployees) ? data.assignedEmployees : [],
      };
      await updateProject(id, payload);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-6">Edit Project</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Project Code *"
            error={errors.projectCode?.message}
            {...register('projectCode', { required: 'Project code is required' })}
          />
          <Input
            label="Project Name *"
            error={errors.name?.message}
            {...register('name', { required: 'Project name is required' })}
          />
          <Dropdown
            label="Department"
            options={departments}
            placeholder="Select department"
            {...register('department')}
          />
          <Dropdown
            label="Status"
            placeholder={null}
            options={PROJECT_STATUS.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' '),
            }))}
            {...register('status')}
          />
          <Dropdown
            label="Priority"
            placeholder={null}
            options={Object.values(PRIORITY).map((p) => ({
              value: p,
              label: p.charAt(0).toUpperCase() + p.slice(1),
            }))}
            {...register('priority')}
          />
          <Input label="Start Date" type="date" {...register('startDate')} />
          <Input label="End Date" type="date" {...register('endDate')} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            {...register('description')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign Employees
          </label>
          <input
            type="text"
            placeholder="Search employees..."
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            className="input-field text-sm"
          />
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No employees found</p>
            ) : (
              filteredEmployees.map((emp) => (
                <label
                  key={emp._id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-0 border-gray-100 dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    value={emp._id}
                    className="rounded text-primary-600"
                    {...register('assignedEmployees')}
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{emp.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{emp.employeeId}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
