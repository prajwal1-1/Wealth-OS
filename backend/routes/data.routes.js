const express = require('express');
const router = express.Router();
const controller = require('../controllers/data.controller');
const { requireWealthUser } = require('../middleware/auth.middleware');

router.use(requireWealthUser);
router.get('/', controller.getData);
router.post('/', controller.saveData);
router.post('/reset', controller.resetData);
router.get('/audit', controller.getAudit);
router.post('/events/watch', controller.watchValuation);
router.get('/news', controller.getNews);
router.get('/market-events', controller.getMarketEvents);

module.exports = router;
