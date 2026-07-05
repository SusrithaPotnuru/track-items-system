import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiSettings } from 'react-icons/fi';
import { getCalendar } from '../../services/holiday.service';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { MONTH_NAMES } from '../../utils/constants';

const HOLIDAY_COLORS = {
  national: 'bg-red-100 text-red-700 border-red-200',
  festival: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  company: 'bg-blue-100 text-blue-700 border-blue-200',
  emergency: 'bg-orange-100 text-orange-700 border-orange-200',
};

const HolidayCalendar = () => {
  const { isAdmin } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCalendar(year, month)
      .then((r) => { setHolidays(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const prev = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const holidayMap = Object.fromEntries(holidays.map((h) => [new Date(h.date).getDate(), h]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Holiday Calendar</h1>
        {isAdmin && <Link to="/holidays/manage"><Button variant="secondary" size="sm"><FiSettings className="mr-1" />Manage Holidays</Button></Link>}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={prev}><FiChevronLeft /></Button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{MONTH_NAMES[month - 1]} {year}</h2>
          <Button variant="ghost" onClick={next}><FiChevronRight /></Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const h = holidayMap[day];
            return (
              <div key={day} className={`relative p-2 min-h-[60px] rounded-lg border text-sm transition-colors ${h ? `${HOLIDAY_COLORS[h.type] || 'bg-gray-100'} border` : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <span className="font-medium">{day}</span>
                {h && <p className="text-xs mt-0.5 leading-tight">{h.name}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm flex-wrap">
        {Object.entries(HOLIDAY_COLORS).map(([type, cls]) => (
          <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${cls}`}>
            <div className={`w-2 h-2 rounded-full bg-current`} />{type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>

      {/* List */}
      {holidays.length > 0 && (
        <div className="card p-4 space-y-2">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Holidays this month</h3>
          {holidays.map((h) => (
            <div key={h._id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{h.name}</p>
                <p className="text-xs text-gray-400">{new Date(h.date).toDateString()}</p>
              </div>
              <Badge value={h.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;
