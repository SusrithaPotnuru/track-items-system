const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/entry.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createEntryValidator, updateEntryValidator, rejectValidator } = require('../validators/entry.validator');

router.use(authMiddleware);

router.get('/check-date', ctrl.checkDate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', createEntryValidator, validate, ctrl.create);
router.put('/:id', updateEntryValidator, validate, ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);           // admin only
router.put('/:id/submit', ctrl.submit);
router.put('/:id/approve', requireRole('admin', 'manager'), ctrl.approve);
router.put('/:id/reject', requireRole('admin', 'manager'), rejectValidator, validate, ctrl.reject);

module.exports = router;
