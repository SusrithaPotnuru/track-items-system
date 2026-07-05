const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/timeline.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', ctrl.getTimeline);
router.get('/:entityId', ctrl.getByEntityId);

module.exports = router;
