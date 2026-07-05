import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLayers } from 'react-icons/fi';

const AuthLayout = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FiLayers className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Productivity Tracker</span>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <Outlet />
      </div>
    </motion.div>
  </div>
);

export default AuthLayout;
