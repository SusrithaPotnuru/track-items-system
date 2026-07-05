import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { FiFileText, FiGrid, FiFile } from 'react-icons/fi';

const SUBTYPE_COLUMNS = {
  'employee-summary': ['employeeId', 'employeeName', 'departmentName', 'totalItems', 'totalHours', 'entryCount', 'avgProductivityScore'],
  'department-summary': ['departmentName', 'departmentCode', 'employeeCount', 'totalItems', 'totalHours', 'entryCount', 'avgProductivityScore'],
  'project-summary': ['projectCode', 'projectName', 'employeeCount', 'totalItems', 'totalHours', 'entryCount', 'avgItemsPerHour'],
  'top-performers': ['rank', 'employeeId', 'employeeName', 'departmentName', 'totalItems', 'totalHours', 'avgProductivityScore', 'performanceLevel'],
  'low-productivity': ['employeeId', 'employeeName', 'departmentName', 'totalItems', 'entryCount', 'avgProductivityScore', 'performanceLevel', 'dailyTargetSnapshot'],
  'missing-entries': ['employeeId', 'employeeName', 'departmentName', 'expectedDays', 'submittedDays', 'missingDays', 'complianceRate'],
  'holiday-working-days': ['date', 'dayName', 'type', 'name'],
};

const COLUMN_LABELS = {
  employeeId: 'Emp ID',
  employeeName: 'Name',
  departmentName: 'Department',
  departmentCode: 'Code',
  projectCode: 'Code',
  projectName: 'Project',
  totalItems: 'Items',
  totalHours: 'Hours',
  entryCount: 'Days',
  avgItemsPerHour: 'Items/Hr',
  avgProductivityScore: 'Score',
  performanceLevel: 'Level',
  dailyTargetSnapshot: 'Target',
  employeeCount: 'Employees',
  rank: '#',
  expectedDays: 'Expected',
  submittedDays: 'Submitted',
  missingDays: 'Missing',
  complianceRate: 'Compliance',
  date: 'Date',
  dayName: 'Day',
  type: 'Type',
  name: 'Name / Reason',
};

const fmtCell = (key, val) => {
  if (val === null || val === undefined) return '—';
  if (key === 'avgProductivityScore' || key === 'complianceRate') return `${Number(val).toFixed(1)}%`;
  if (key === 'totalHours') return `${Number(val).toFixed(1)}h`;
  if (key === 'avgItemsPerHour') return Number(val).toFixed(2);
  return String(val);
};

const PreviewModal = ({ open, onClose, preview, subType = 'employee-summary', onExport, title = 'Report Preview' }) => {
  if (!preview) return null;
  const { rows = [], summary, period } = preview;
  const cols = SUBTYPE_COLUMNS[subType] || SUBTYPE_COLUMNS['employee-summary'];
  const displayRows = rows.slice(0, 100);

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {/* Period + row count */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{period}</p>
            <p className="text-xs text-gray-400 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
          </div>
          {summary && (
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              {Object.entries(summary).map(([k, v]) => (
                <span key={k}><span className="font-medium capitalize">{k}:</span> {v}</span>
              ))}
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No data found for the selected filters and period.
          </div>
        ) : (
          <div className="overflow-auto max-h-96 rounded-lg border border-gray-100 dark:border-gray-700">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                  {cols.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {COLUMN_LABELS[c] || c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-50 dark:border-gray-700 ${
                      i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''
                    }`}
                  >
                    {cols.map((c) => (
                      <td key={c} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {fmtCell(c, row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <p className="text-center text-xs text-gray-400 py-2">
                Showing first 100 of {rows.length} records. Full data included in export.
              </p>
            )}
          </div>
        )}

        {/* Export buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Export as:</span>
          <Button variant="secondary" size="sm" onClick={() => onExport('pdf')}>
            <FiFileText className="mr-1 text-red-500" />PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onExport('excel')}>
            <FiGrid className="mr-1 text-green-600" />Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onExport('csv')}>
            <FiFile className="mr-1 text-blue-500" />CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PreviewModal;
