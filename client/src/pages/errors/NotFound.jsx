import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
    <h1 className="text-8xl font-bold text-gray-200 dark:text-gray-700">404</h1>
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-4">Page Not Found</h2>
    <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
    <Link to="/" className="mt-6"><Button>Go to Dashboard</Button></Link>
  </div>
);

export default NotFound;
