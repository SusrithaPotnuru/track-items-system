import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiEdit2, FiArrowLeft } from 'react-icons/fi';
import { getEmployee } from '../../services/employee.service';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const SERVER_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api.*$/, '');

const EmployeeDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployee(id).then((r) => { setEmp(r.data.data); setLoading(false); });
  }, [id]);

  if (loading) return <Loader />;
  if (!emp) return <p className="text-gray-500">Employee not found.</p>;

  const photoUrl = emp.photo ? `${SERVER_ORIGIN}${emp.photo}` : null;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/employees">
          <Button variant="ghost" size="sm"><FiArrowLeft /></Button>
        </Link>
        <h1 className="page-title">Employee Details</h1>
        {isAdmin && (
          <Link to={`/employees/${id}/edit`} className="ml-auto">
            <Button size="sm"><FiEdit2 className="mr-1" />Edit</Button>
          </Link>
        )}
      </div>

      <div className="card p-6 flex gap-6 items-start">
        <Avatar src={photoUrl} name={emp.name} size="lg" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{emp.name}</h2>
          <p className="text-gray-500">{emp.designation}</p>
          <p className="text-sm text-gray-400">{emp.employeeId}</p>
          <div className="mt-2"><Badge value={emp.status} /></div>
        </div>
      </div>

      <div className="card p-6 grid grid-cols-2 gap-4 text-sm">
        {[
          ['Email', emp.email],
          ['Phone', emp.phone],
          ['Department', emp.department?.name],
          ['Joined', formatDate(emp.joiningDate)],
          ['Daily Target', emp.dailyTarget],
          ['Weekly Target', emp.weeklyTarget],
          ['Monthly Target', emp.monthlyTarget],
          ['Address', emp.address],
        ].map(([label, val]) => (
          <div key={label}>
            <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">{val || '—'}</p>
          </div>
        ))}
      </div>

      {emp.notes && (
        <div className="card p-6 text-sm">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{emp.notes}</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetails;
