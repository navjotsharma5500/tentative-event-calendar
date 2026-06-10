const ColorCategory = require('../models/ColorCategory');
const DateColorAssignment = require('../models/DateColorAssignment');
const DateRangeAssignment = require('../models/DateRangeAssignment');

function normalizeHex(color) {
  return (color || '').trim().toUpperCase();
}

function toDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function categoryPayload(category) {
  if (!category) return null;
  return {
    _id: category._id,
    name: category.name,
    color: category.color,
    description: category.description,
    isActive: category.isActive,
    showDescription: category.showDescription !== false,
  };
}

function addColorToDate(map, dateKey, category) {
  const payload = categoryPayload(category);
  if (!payload) return;
  if (!map[dateKey]) map[dateKey] = [];
  map[dateKey].push(payload);
}

async function getColorCategories(req, res) {
  try {
    const categories = await ColorCategory.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createColorCategory(req, res) {
  try {
    const payload = {
      name: req.body.name,
      color: normalizeHex(req.body.color),
      description: req.body.description,
      isActive: req.body.isActive !== false,
      showDescription: req.body.showDescription !== false,
    };
    const category = new ColorCategory(payload);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.code === 11000 ? 'Category name and colour must be unique' : err.message });
  }
}

async function updateColorCategory(req, res) {
  try {
    const payload = { ...req.body };
    if (payload.color) payload.color = normalizeHex(payload.color);
    const category = await ColorCategory.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.code === 11000 ? 'Category name and colour must be unique' : err.message });
  }
}

async function deleteColorCategory(req, res) {
  try {
    const category = await ColorCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await Promise.all([
      DateColorAssignment.deleteMany({ categoryId: req.params.id }),
      DateRangeAssignment.deleteMany({ categoryId: req.params.id }),
    ]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDateColorAssignments(req, res) {
  try {
    const [single, ranges] = await Promise.all([
      DateColorAssignment.find({}).populate('categoryId').sort({ date: 1, createdAt: -1 }),
      DateRangeAssignment.find({}).populate('categoryId').sort({ startDate: 1, createdAt: -1 }),
    ]);
    res.json({ single, ranges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createDateColorAssignment(req, res) {
  try {
    const { type, categoryId, date, startDate, endDate } = req.body;
    if (type === 'range') {
      if (!startDate || !endDate) return res.status(400).json({ error: 'Start date and end date are required' });
      if (startDate > endDate) return res.status(400).json({ error: 'Start date cannot be after end date' });
      const created = await DateRangeAssignment.create({ categoryId, startDate, endDate, type: 'range' });
      return res.status(201).json(await created.populate('categoryId'));
    }

    if (!date) return res.status(400).json({ error: 'Date is required' });
    const created = await DateColorAssignment.create({ categoryId, date, type: 'single' });
    res.status(201).json(await created.populate('categoryId'));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateDateColorAssignment(req, res) {
  try {
    const { type, categoryId, date, startDate, endDate } = req.body;
    let updated;

    if (type === 'range') {
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ error: 'Start date cannot be after end date' });
      }
      updated = await DateRangeAssignment.findByIdAndUpdate(
        req.params.id,
        { categoryId, startDate, endDate, type: 'range' },
        { new: true, runValidators: true }
      ).populate('categoryId');
    } else {
      updated = await DateColorAssignment.findByIdAndUpdate(
        req.params.id,
        { categoryId, date, type: 'single' },
        { new: true, runValidators: true }
      ).populate('categoryId');
    }

    if (!updated) return res.status(404).json({ error: 'Assignment not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteDateColorAssignment(req, res) {
  try {
    const [single, range] = await Promise.all([
      DateColorAssignment.findByIdAndDelete(req.params.id),
      DateRangeAssignment.findByIdAndDelete(req.params.id),
    ]);
    if (!single && !range) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'Assignment removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCalendarColorMap(req, res) {
  try {
    const start = req.query.start || '1900-01-01';
    const end = req.query.end || '2100-12-31';

    const [single, ranges] = await Promise.all([
      DateColorAssignment.find({ date: { $gte: start, $lte: end } })
        .populate('categoryId')
        .sort({ createdAt: 1 }),
      DateRangeAssignment.find({ startDate: { $lte: end }, endDate: { $gte: start } })
        .populate('categoryId')
        .sort({ createdAt: 1 }),
    ]);

    const map = {};

    for (const assignment of ranges) {
      const category = assignment.categoryId;
      if (!category?.isActive) continue;
      let cursor = new Date(`${assignment.startDate < start ? start : assignment.startDate}T00:00:00`);
      const last = new Date(`${assignment.endDate > end ? end : assignment.endDate}T00:00:00`);

      while (cursor <= last) {
        const dateKey = toDateStr(cursor);
        addColorToDate(map, dateKey, category);
        cursor = addDays(cursor, 1);
      }
    }

    for (const assignment of single) {
      const category = assignment.categoryId;
      if (!category?.isActive) continue;
      addColorToDate(map, assignment.date, category);
    }

    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getColorCategories,
  createColorCategory,
  updateColorCategory,
  deleteColorCategory,
  getDateColorAssignments,
  createDateColorAssignment,
  updateDateColorAssignment,
  deleteDateColorAssignment,
  getCalendarColorMap,
};
