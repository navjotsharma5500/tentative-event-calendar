const express = require('express');
const router = express.Router();
const {
  getColorCategories,
  createColorCategory,
  updateColorCategory,
  deleteColorCategory,
  getDateColorAssignments,
  createDateColorAssignment,
  updateDateColorAssignment,
  deleteDateColorAssignment,
  getCalendarColorMap,
} = require('../controllers/colorController');
const { requireAdmin } = require('../middleware/auth');

router.get('/color-categories', getColorCategories);
router.post('/color-categories', requireAdmin, createColorCategory);
router.put('/color-categories/:id', requireAdmin, updateColorCategory);
router.delete('/color-categories/:id', requireAdmin, deleteColorCategory);

router.get('/date-color-assignments', requireAdmin, getDateColorAssignments);
router.post('/date-color-assignments', requireAdmin, createDateColorAssignment);
router.put('/date-color-assignments/:id', requireAdmin, updateDateColorAssignment);
router.delete('/date-color-assignments/:id', requireAdmin, deleteDateColorAssignment);

router.get('/calendar-color-map', getCalendarColorMap);

module.exports = router;
