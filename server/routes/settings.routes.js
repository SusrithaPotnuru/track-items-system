const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settings.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { generalValidator, productivityValidator, smtpValidator, securityValidator, schedulerValidator } = require('../validators/settings.validator');
const { uploadLogo } = require('../config/multer');

router.use(authMiddleware, requireRole('admin'));

router.get('/', ctrl.get);
router.put('/general', generalValidator, validate, ctrl.updateGeneral);
router.put('/productivity', productivityValidator, validate, ctrl.updateProductivity);
router.put('/smtp', smtpValidator, validate, ctrl.updateSmtp);
router.post('/smtp/test', ctrl.testSmtp);
router.put('/security', securityValidator, validate, ctrl.updateSecurity);
router.put('/scheduler', schedulerValidator, validate, ctrl.updateScheduler);
router.post('/logo', uploadLogo.single('logo'), ctrl.uploadLogo);

module.exports = router;
