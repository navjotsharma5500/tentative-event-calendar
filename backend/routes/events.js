const express = require('express');
const router = express.Router();
const {
  getAllEvents, getVenues, getSocieties, getEventsByDate,
  getCalendarMonth, createEvent, updateEvent, deleteEvent, ignoreEventConflict, importEvents,
} = require('../controllers/eventController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', getAllEvents);
router.get('/venues', getVenues);
router.get('/societies', getSocieties);
router.get('/by-date/:date', getEventsByDate);
router.get('/calendar/:year/:month', getCalendarMonth);

router.post('/', requireAdmin, createEvent);
router.patch('/:id/ignore-conflict', requireAdmin, ignoreEventConflict);
router.put('/:id', requireAdmin, updateEvent);
router.delete('/:id', requireAdmin, deleteEvent);
router.post('/import', requireAdmin, importEvents);

module.exports = router;
