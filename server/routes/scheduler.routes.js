const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scheduler.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

router.use(authMiddleware, requireRole('admin'));

router.get('/status', ctrl.getStatus);
router.post('/toggle', ctrl.toggle);
router.post('/run', ctrl.runManually);
router.get('/logs', ctrl.getLogs);

module.exports = router;
