const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

router.use(authMiddleware);

// KPI — cached, all roles
router.get('/kpi', ctrl.getKpi);

// Trends
router.get('/trends/monthly', ctrl.getMonthlyTrend);
router.get('/trends/weekly', ctrl.getWeeklyTrend);
router.get('/trends/yearly', ctrl.getYearlyTrend);

// Breakdowns
router.get('/productivity', ctrl.getProductivity);
router.get('/department', ctrl.getDepartment);
router.get('/project', ctrl.getProject);

// Performers
router.get('/employees/top', ctrl.getTopEmployees);
router.get('/employees/low', ctrl.getLowPerformers);

// Workflow analytics
router.get('/approval-time', ctrl.getApprovalTime);
router.get('/rejections', ctrl.getRejections);

// Per-employee score
router.get('/score/:employeeId', ctrl.getEmployeeScore);

// Export (admin only)
router.get('/export', requireRole('admin'), ctrl.exportAnalytics);

// Cache management (admin only)
router.delete('/cache', requireRole('admin'), ctrl.clearCache);

module.exports = router;
