const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyPassword, downloadTemplate, downloadEventsExcel, uploadExcel } = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are accepted'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/verify-password', verifyPassword);
router.get('/template', requireAdmin, downloadTemplate);
router.get('/export-events', requireAdmin, downloadEventsExcel);
router.post('/upload', requireAdmin, upload.single('file'), uploadExcel);

module.exports = router;
