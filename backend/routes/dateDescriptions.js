const express = require('express');
const router = express.Router();
const {
  getDateDescriptions,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  createTeachingMapping,
  updateTeachingMapping,
  deleteTeachingMapping,
} = require('../controllers/dateDescriptionController');
const { requireAdmin } = require('../middleware/auth');

router.get('/date-descriptions', getDateDescriptions);

router.post('/date-descriptions/holidays', requireAdmin, createHoliday);
router.put('/date-descriptions/holidays/:id', requireAdmin, updateHoliday);
router.delete('/date-descriptions/holidays/:id', requireAdmin, deleteHoliday);

router.post('/date-descriptions/teaching-mappings', requireAdmin, createTeachingMapping);
router.put('/date-descriptions/teaching-mappings/:id', requireAdmin, updateTeachingMapping);
router.delete('/date-descriptions/teaching-mappings/:id', requireAdmin, deleteTeachingMapping);

module.exports = router;
