import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      const user = await login(data);
      navigate(user.role === 'admin' ? '/' : '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <FiMail className="absolute left-3 top-9 text-gray-400 w-4 h-4" />
          <Input
            label="Email"
            type="email"
            placeholder="admin@company.com"
            className="pl-9"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
        </div>

        <div className="relative">
          <FiLock className="absolute left-3 top-9 text-gray-400 w-4 h-4 z-10" />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            className="pl-9"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">Sign In</Button>
      </form>
    </div>
  );
};

export default Login;
