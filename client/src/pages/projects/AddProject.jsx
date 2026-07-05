import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createProject } from '../../services/project.service';
import { getDepartments } from '../../services/department.service';
import { getEmployees } from '../../services/employee.service';
import Input from '../../components/common/Input';
import Dropdown from '../../components/common/Dropdown';
import Button from '../../components/common/Button';
import { PROJECT_STATUS, PRIORITY } from '../../utils/constants';

const AddProject = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { status: 'planning', priority: 'medium' },
  });

  useEffect(() => {
    Promise.all([
      getDepartments({ limit: 100, status: 'active' }),
      getEmployees({ limit: 200, status: 'active', sortBy: 'name', sortOrder: 'asc' }),
    ]).then(([dRes, eRes]) => {
      setDepartments(dRes.data.data.map((d) => ({ value: d._id, label: d.name })));
      setEmployees(eRes.data.data);
    });
  }, []);

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
      await createProject(payload);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-6">Add Project</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Project Code *"
            placeholder="PRJ001"
            error={errors.projectCode?.message}
            {...register('projectCode', { required: 'Project code is required' })}
          />
          <Input
            label="Project Name *"
            placeholder="Website Redesign"
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
            placeholder="Project description..."
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
          <Button type="submit" loading={isSubmitting}>Create Project</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;
