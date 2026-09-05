const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/files.controller');
const { requireWealthUser } = require('../middleware/auth.middleware');

const upload = multer({ dest: path.join(__dirname, '../../tmp/uploads') });

router.post('/', requireWealthUser, upload.single('file'), controller.uploadFile);
router.get('/:id', controller.getFile);
router.post('/:id/token', requireWealthUser, controller.createDownloadToken);
router.get('/:id/download', controller.downloadFile);
router.post('/:id/analyze', requireWealthUser, controller.analyzeFile);
router.post('/export', requireWealthUser, controller.exportFiles);
router.delete('/:id', requireWealthUser, controller.deleteFile);

module.exports = router;
