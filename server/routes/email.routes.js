const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/email.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { sendEmailValidator, testEmailValidator } = require('../validators/email.validator');

router.use(authMiddleware);

router.post('/send', sendEmailValidator, validate, ctrl.send);
router.post('/test', requireRole('admin'), testEmailValidator, validate, ctrl.sendTest);
router.post('/validate-smtp', requireRole('admin'), ctrl.validateSmtp);
router.get('/stats', ctrl.getStats);
router.get('/history', ctrl.getHistory);
router.post('/:id/retry', ctrl.retryEmail);
router.get('/:id', ctrl.getById);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
