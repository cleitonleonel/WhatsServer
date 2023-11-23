const express = require('express');
const router = express.Router();
const multer = require('multer');
const controllers = require('../controllers/messagesControllers');
const validators = require('../validators/paramValidators');
const fs = require('fs');
const path = require('path');
const upload_dir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(upload_dir)) {
  fs.mkdirSync(upload_dir, { recursive: true });
  fs.chmodSync(upload_dir, 0o777);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({storage: storage});

router.get('/', controllers.getIndex);

router.get('/api/v1/qrcode', controllers.getQrcode);
router.get('/api/v1/clients', controllers.getClients);

router.get('/api/v1/sendtext', controllers.getSendText);

router.post('/api/v1/start', controllers.startSession);

router.post('/api/v1/close', controllers.closeSession);
router.post('/api/v1/logout', controllers.logoutSession);

router.post('/api/v1/check', controllers.checkExists);

router.post('/api/v1/sendtext', validators.validateParams, controllers.postSendText);
router.post('/api/v1/sendfile', validators.validateParams, controllers.sendFile);
router.post('/api/v1/upload', upload.any(), controllers.uploadFile);
router.post('/api/v1/sendimageurl', validators.validateParams, controllers.sendImageUrl);
router.post('/api/v1/sendvideo', validators.validateParams, controllers.sendVideo);
router.post('/api/v1/sendlocation', validators.validateParams, controllers.sendLocation);
router.post('/api/v1/sendvoice', validators.validateParams, controllers.sendVoice);
router.post('/api/v1/sendvcard', validators.validateParams, controllers.sendVcard);

module.exports = router;
