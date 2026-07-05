const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/departments', require('./department.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/projects', require('./project.routes'));
router.use('/entries', require('./entry.routes'));
router.use('/holidays', require('./holiday.routes'));
router.use('/reports', require('./report.routes'));
router.use('/emails', require('./email.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/scheduler', require('./scheduler.routes'));
router.use('/audit-logs', require('./auditLog.routes'));
router.use('/timeline', require('./timeline.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/search', require('./search.routes'));

module.exports = router;
