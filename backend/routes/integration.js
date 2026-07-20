const express = require('express');
const Event = require('../models/Event');
const ColorCategory = require('../models/ColorCategory');
const DateColorAssignment = require('../models/DateColorAssignment');
const DateRangeAssignment = require('../models/DateRangeAssignment');
const HolidayDescription = require('../models/HolidayDescription');
const TeachingDayMapping = require('../models/TeachingDayMapping');
const { recalculateAllConflicts } = require('../utils/conflictDetection');

const router = express.Router();

function requireInternalCalendarKey(req, res, next) {
  const configuredKey = process.env.CALENDAR_INTERNAL_API_KEY;
  if (!configuredKey || req.headers['x-calendar-api-key'] !== configuredKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized integration request' });
  }
  next();
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginationPayload(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

router.use(requireInternalCalendarKey);

router.get('/events', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
    const skip = (page - 1) * limit;
    const { search, society, department, venue, startDate, endDate, status, conflictOnly } = req.query;

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { event: { $regex: safeSearch, $options: 'i' } },
        { society: { $regex: safeSearch, $options: 'i' } },
        { venue: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    const societyFilter = society || department;
    if (societyFilter) query.society = { $regex: escapeRegex(societyFilter), $options: 'i' };
    if (venue) query.venue = { $regex: escapeRegex(venue), $options: 'i' };
    if (startDate || endDate) {
      query.startDate = { $lte: endDate || '9999-12-31' };
      query.endDate = { $gte: startDate || '0000-01-01' };
    }
    if (conflictOnly === 'true') query.conflict = true;

    const [total, docs] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query).sort({ startDate: 1, startTime: 1 }).skip(skip).limit(limit).lean(),
    ]);

    const data = status
      ? docs.filter((event) => String(event.status || '').toLowerCase() === String(status).toLowerCase())
      : docs;

    res.json({ success: true, data, pagination: paginationPayload(page, limit, total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await recalculateAllConflicts(Event);
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await recalculateAllConflicts(Event);
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/date-colors', async (req, res) => {
  try {
    const [categories, single, ranges] = await Promise.all([
      ColorCategory.find({}).sort({ name: 1 }).lean(),
      DateColorAssignment.find({}).populate('categoryId').sort({ date: 1, createdAt: -1 }).lean(),
      DateRangeAssignment.find({}).populate('categoryId').sort({ startDate: 1, createdAt: -1 }).lean(),
    ]);
    res.json({ success: true, data: { categories, single, ranges } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/holidays', async (req, res) => {
  try {
    const query = {};
    if (req.query.start || req.query.end) {
      query.date = {};
      if (req.query.start) query.date.$gte = req.query.start;
      if (req.query.end) query.date.$lte = req.query.end;
    }
    const data = await HolidayDescription.find(query).sort({ date: 1, createdAt: 1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/teaching-days', async (req, res) => {
  try {
    const query = {};
    if (req.query.start || req.query.end) {
      query.nonTeachingDate = {};
      if (req.query.start) query.nonTeachingDate.$gte = req.query.start;
      if (req.query.end) query.nonTeachingDate.$lte = req.query.end;
    }
    const data = await TeachingDayMapping.find(query).sort({ nonTeachingDate: 1, createdAt: 1 }).lean();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
