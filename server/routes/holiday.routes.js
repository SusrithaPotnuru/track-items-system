const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/holiday.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { holidayValidator } = require('../validators/holiday.validator');
const auditMiddleware = require('../middlewares/audit.middleware');

router.use(authMiddleware);

router.get('/', ctrl.getAll);
router.get('/calendar/:year/:month', ctrl.getCalendar);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('admin'), holidayValidator, validate, auditMiddleware('holiday'), ctrl.create);
router.put('/:id', requireRole('admin'), holidayValidator, validate, auditMiddleware('holiday'), ctrl.update);
router.delete('/:id', requireRole('admin'), auditMiddleware('holiday'), ctrl.remove);

module.exports = router;
