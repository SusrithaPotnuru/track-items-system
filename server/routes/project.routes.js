const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { projectValidator } = require('../validators/project.validator');
const auditMiddleware = require('../middlewares/audit.middleware');

router.use(authMiddleware);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('admin'), projectValidator, validate, auditMiddleware('project'), ctrl.create);
router.put('/:id', requireRole('admin'), projectValidator, validate, auditMiddleware('project'), ctrl.update);
router.delete('/:id', requireRole('admin'), auditMiddleware('project'), ctrl.remove);

module.exports = router;
