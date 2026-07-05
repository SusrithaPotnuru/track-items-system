import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiUsers, FiFolderPlus, FiClock, FiCalendar, FiFileText,
  FiMail, FiSettings, FiShield, FiChevronLeft, FiChevronRight, FiLayers, FiBarChart2, FiGrid
} from 'react-icons/fi';

const NAV = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/departments', icon: FiGrid, label: 'Departments' },
  { to: '/employees', icon: FiUsers, label: 'Employees' },
  { to: '/projects', icon: FiFolderPlus, label: 'Projects' },
  { to: '/entries', icon: FiClock, label: 'Daily Entries' },
  { to: '/holidays', icon: FiCalendar, label: 'Holidays' },
  { to: '/reports', icon: FiFileText, label: 'Reports' },
  { to: '/email', icon: FiMail, label: 'Email' },
  { to: '/analytics', icon: FiBarChart2, label: 'Analytics', adminOnly: true },
  { to: '/audit', icon: FiShield, label: 'Audit Logs', adminOnly: true },
  { to: '/settings', icon: FiSettings, label: 'Settings', adminOnly: true },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0 bg-gray-900 text-white flex flex-col h-screen sticky top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <FiLayers className="w-4 h-4" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-sm whitespace-nowrap">
              Timesheet System
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.filter((item) => !item.adminOnly || isAdmin).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors text-sm font-medium ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center p-3 border-t border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
