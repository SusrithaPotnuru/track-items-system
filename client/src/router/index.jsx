import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

const Login = lazy(() => import('../pages/auth/Login'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Departments = lazy(() => import('../pages/departments/Departments'));
const Employees = lazy(() => import('../pages/employees/Employees'));
const AddEmployee = lazy(() => import('../pages/employees/AddEmployee'));
const EditEmployee = lazy(() => import('../pages/employees/EditEmployee'));
const EmployeeDetails = lazy(() => import('../pages/employees/EmployeeDetails'));
const Projects = lazy(() => import('../pages/projects/Projects'));
const AddProject = lazy(() => import('../pages/projects/AddProject'));
const EditProject = lazy(() => import('../pages/projects/EditProject'));
const ProjectDetails = lazy(() => import('../pages/projects/ProjectDetails'));
const Entries = lazy(() => import('../pages/entries/Entries'));
const AddEntry = lazy(() => import('../pages/entries/AddEntry'));
const EditEntry = lazy(() => import('../pages/entries/EditEntry'));
const EntryDetails = lazy(() => import('../pages/entries/EntryDetails'));
const HolidayCalendar = lazy(() => import('../pages/holidays/HolidayCalendar'));
const HolidayManagement = lazy(() => import('../pages/holidays/HolidayManagement'));
const Reports = lazy(() => import('../pages/reports/Reports'));
const WeeklyReports = lazy(() => import('../pages/reports/WeeklyReports'));
const MonthlyReports = lazy(() => import('../pages/reports/MonthlyReports'));
const CustomReports = lazy(() => import('../pages/reports/CustomReports'));
const AnalyticsReports = lazy(() => import('../pages/reports/AnalyticsReports'));
const Analytics = lazy(() => import('../pages/analytics/Analytics'));
const EmailHistory = lazy(() => import('../pages/email/EmailHistory'));
const SendReport = lazy(() => import('../pages/email/SendReport'));
const EmailSettings = lazy(() => import('../pages/email/EmailSettings'));
const Settings = lazy(() => import('../pages/settings/Settings'));
const AuditLogs = lazy(() => import('../pages/audit/AuditLogs'));
const Profile = lazy(() => import('../pages/profile/Profile'));
const NotFound = lazy(() => import('../pages/errors/NotFound'));
const Unauthorized = lazy(() => import('../pages/errors/Unauthorized'));
const Forbidden = lazy(() => import('../pages/errors/Forbidden'));

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },
  {
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/departments', element: <Departments /> },
      { path: '/employees', element: <Employees /> },
      { path: '/employees/add', element: <AddEmployee /> },
      { path: '/employees/:id', element: <EmployeeDetails /> },
      { path: '/employees/:id/edit', element: <EditEmployee /> },
      { path: '/projects', element: <Projects /> },
      { path: '/projects/add', element: <AddProject /> },
      { path: '/projects/:id', element: <ProjectDetails /> },
      { path: '/projects/:id/edit', element: <EditProject /> },
      { path: '/entries', element: <Entries /> },
      { path: '/entries/add', element: <AddEntry /> },
      { path: '/entries/:id', element: <EntryDetails /> },
      { path: '/entries/:id/edit', element: <EditEntry /> },
      { path: '/holidays', element: <HolidayCalendar /> },
      { path: '/holidays/manage', element: <ProtectedRoute adminOnly><HolidayManagement /></ProtectedRoute> },
      { path: '/reports', element: <Reports /> },
      { path: '/reports/weekly', element: <WeeklyReports /> },
      { path: '/reports/monthly', element: <MonthlyReports /> },
      { path: '/reports/custom', element: <CustomReports /> },
      { path: '/reports/analytics', element: <AnalyticsReports /> },
      { path: '/email', element: <EmailHistory /> },
      { path: '/email/send', element: <SendReport /> },
      { path: '/email/settings', element: <ProtectedRoute adminOnly><EmailSettings /></ProtectedRoute> },
      { path: '/settings', element: <ProtectedRoute adminOnly><Settings /></ProtectedRoute> },
      { path: '/analytics', element: <ProtectedRoute adminOnly><Analytics /></ProtectedRoute> },
      { path: '/audit', element: <ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute> },
      { path: '/profile', element: <Profile /> },
    ],
  },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '/forbidden', element: <Forbidden /> },
  { path: '*', element: <NotFound /> },
]);

export default router;
