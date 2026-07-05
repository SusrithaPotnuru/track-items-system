import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const ICONS = {
  success: <FiCheck className="w-4 h-4" />,
  error: <FiX className="w-4 h-4" />,
  warning: <FiAlertTriangle className="w-4 h-4" />,
  info: <FiInfo className="w-4 h-4" />,
};

const COLORS = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          className={`flex items-start gap-3 p-3 rounded-lg border shadow-md ${COLORS[t.type]}`}
        >
          <span className="mt-0.5">{ICONS[t.type]}</span>
          <p className="text-sm flex-1">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="text-current opacity-60 hover:opacity-100">
            <FiX className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default ToastContainer;
