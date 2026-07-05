const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/department.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { departmentValidator } = require('../validators/department.validator');
const auditMiddleware = require('../middlewares/audit.middleware');

router.use(authMiddleware);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('admin'), departmentValidator, validate, auditMiddleware('department'), ctrl.create);
router.put('/:id', requireRole('admin'), departmentValidator, validate, auditMiddleware('department'), ctrl.update);
router.delete('/:id', requireRole('admin'), auditMiddleware('department'), ctrl.remove);

module.exports = router;
