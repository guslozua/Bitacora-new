// routes/abmSocial.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadSocialExcel } = require('../controllers/abmSocialController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), uploadSocialExcel);

module.exports = router;
