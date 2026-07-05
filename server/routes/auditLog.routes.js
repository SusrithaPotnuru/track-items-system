const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditLog.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

router.use(authMiddleware, requireRole('admin'));

router.get('/stats', ctrl.getStats);
router.get('/export', ctrl.exportLogs);
router.get('/', ctrl.getLogs);
router.get('/:id', ctrl.getById);

module.exports = router;
