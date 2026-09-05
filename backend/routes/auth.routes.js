const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { authRateLimit, requireWealthUser } = require('../middleware/auth.middleware');

router.post('/signup', authRateLimit, controller.signup);
router.post('/login', authRateLimit, controller.login);
router.get('/session', requireWealthUser, controller.session);
router.post('/logout', requireWealthUser, controller.logout);

module.exports = router;
