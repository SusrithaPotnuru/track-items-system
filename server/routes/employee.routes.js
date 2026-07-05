const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/employee.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { employeeValidator } = require('../validators/employee.validator');
const { uploadEmployeePhoto } = require('../config/multer');

router.use(authMiddleware);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('admin'), employeeValidator, validate, ctrl.create);
router.put('/:id', requireRole('admin'), employeeValidator, validate, ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);
router.post('/:id/photo', requireRole('admin'), uploadEmployeePhoto.single('photo'), ctrl.uploadPhoto);

module.exports = router;
