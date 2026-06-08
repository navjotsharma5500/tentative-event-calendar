const HolidayDescription = require('../models/HolidayDescription');
const TeachingDayMapping = require('../models/TeachingDayMapping');

function sanitizeTeachingDates(dates) {
  return [...new Set((dates || []).map((date) => String(date).trim()).filter(Boolean))];
}

async function getDateDescriptions(req, res) {
  try {
    const { start, end, teachingStart, teachingEnd } = req.query;
    const holidayQuery = {};
    const teachingQuery = {};
    if (start || end) {
      holidayQuery.date = {};
      teachingQuery.nonTeachingDate = {};
      if (start) {
        holidayQuery.date.$gte = start;
        teachingQuery.nonTeachingDate.$gte = start;
      }
      if (end) {
        holidayQuery.date.$lte = end;
        teachingQuery.nonTeachingDate.$lte = end;
      }
    }
    if (teachingStart || teachingEnd) {
      teachingQuery.nonTeachingDate = {};
      if (teachingStart) teachingQuery.nonTeachingDate.$gte = teachingStart;
      if (teachingEnd) teachingQuery.nonTeachingDate.$lte = teachingEnd;
    }

    const [holidays, teachingMappings] = await Promise.all([
      HolidayDescription.find(holidayQuery).sort({ date: 1, createdAt: 1 }),
      TeachingDayMapping.find(teachingQuery).sort({ nonTeachingDate: 1, createdAt: 1 }),
    ]);

    res.json({ holidays, teachingMappings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createHoliday(req, res) {
  try {
    const { date, description } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    if (!String(description || '').trim()) return res.status(400).json({ error: 'Description is required' });

    const holiday = await HolidayDescription.create({ date, description });
    res.status(201).json(holiday);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateHoliday(req, res) {
  try {
    const { date, description } = req.body;
    const holiday = await HolidayDescription.findByIdAndUpdate(
      req.params.id,
      { date, description },
      { new: true, runValidators: true }
    );
    if (!holiday) return res.status(404).json({ error: 'Holiday entry not found' });
    res.json(holiday);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteHoliday(req, res) {
  try {
    const holiday = await HolidayDescription.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ error: 'Holiday entry not found' });
    res.json({ message: 'Holiday entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createTeachingMapping(req, res) {
  try {
    const { nonTeachingDate } = req.body;
    const teachingDates = sanitizeTeachingDates(req.body.teachingDates);
    if (!nonTeachingDate) return res.status(400).json({ error: 'Non-teaching date is required' });
    if (teachingDates.length === 0) return res.status(400).json({ error: 'Select at least one teaching date' });

    const mapping = await TeachingDayMapping.create({ nonTeachingDate, teachingDates });
    res.status(201).json(mapping);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateTeachingMapping(req, res) {
  try {
    const { nonTeachingDate } = req.body;
    const teachingDates = sanitizeTeachingDates(req.body.teachingDates);
    const mapping = await TeachingDayMapping.findByIdAndUpdate(
      req.params.id,
      { nonTeachingDate, teachingDates },
      { new: true, runValidators: true }
    );
    if (!mapping) return res.status(404).json({ error: 'Teaching day mapping not found' });
    res.json(mapping);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteTeachingMapping(req, res) {
  try {
    const mapping = await TeachingDayMapping.findByIdAndDelete(req.params.id);
    if (!mapping) return res.status(404).json({ error: 'Teaching day mapping not found' });
    res.json({ message: 'Teaching day mapping deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getDateDescriptions,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  createTeachingMapping,
  updateTeachingMapping,
  deleteTeachingMapping,
};
