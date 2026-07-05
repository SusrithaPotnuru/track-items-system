const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/stats', ctrl.getStats);
router.get('/charts', ctrl.getCharts);
router.get('/top-performers', ctrl.getTopPerformers);
router.get('/recent-activities', ctrl.getRecentActivities);

module.exports = router;
