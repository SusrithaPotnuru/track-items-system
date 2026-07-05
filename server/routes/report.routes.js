const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  weeklyReportValidator,
  monthlyReportValidator,
  customReportValidator,
  analyticsQueryValidator,
} = require('../validators/report.validator');

router.use(authMiddleware);

// Specific routes BEFORE /:id
router.get('/summary', ctrl.getSummary);
router.get('/analytics', analyticsQueryValidator, validate, ctrl.getAnalytics);
router.get('/', ctrl.getAll);

// Generate
router.post('/generate/weekly', weeklyReportValidator, validate, ctrl.generateWeekly);
router.post('/generate/monthly', monthlyReportValidator, validate, ctrl.generateMonthly);
router.post('/generate/custom', customReportValidator, validate, ctrl.generateCustom);

// Parameterized AFTER specific routes
router.get('/:id/download', ctrl.download);
router.get('/:id', ctrl.getById);
router.delete('/:id', ctrl.remove);

module.exports = router;
