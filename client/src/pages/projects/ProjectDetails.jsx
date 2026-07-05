import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiEdit2, FiArrowLeft } from 'react-icons/fi';
import { getProject } from '../../services/project.service';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';

const ProjectDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProject(id).then((r) => { setProject(r.data.data); setLoading(false); });
  }, [id]);

  if (loading) return <Loader />;
  if (!project) return <p className="text-gray-500">Project not found.</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/projects"><Button variant="ghost" size="sm"><FiArrowLeft /></Button></Link>
        <h1 className="page-title flex-1">{project.name}</h1>
        {isAdmin && <Link to={`/projects/${id}/edit`}><Button size="sm"><FiEdit2 className="mr-1" />Edit</Button></Link>}
      </div>

      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{project.projectCode}</span>
          <Badge value={project.status} />
          <Badge value={project.priority} />
        </div>
        <p className="text-gray-500 text-sm">{project.description || 'No description'}</p>

        <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
          {[
            ['Department', project.department?.name],
            ['Start Date', formatDate(project.startDate)],
            ['End Date', formatDate(project.endDate)],
            ['Team Size', project.assignedEmployees?.length],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{val || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {project.assignedEmployees?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Team Members</h3>
          <div className="space-y-2">
            {project.assignedEmployees.map((emp) => (
              <div key={emp._id} className="flex items-center gap-3">
                <Avatar name={emp.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{emp.name}</p>
                  <p className="text-xs text-gray-400">{emp.employeeId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
