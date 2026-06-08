const { generateTemplate, generateEventsExport, parseExcelFile } = require('../utils/excelUtils');
const Event = require('../models/Event');
const { recalculateAllConflicts } = require('../utils/conflictDetection');

async function verifyPassword(req, res) {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
}

async function downloadTemplate(req, res) {
  try {
    const buffer = generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="event-import-template.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function uploadExcel(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const events = parseExcelFile(req.file.buffer);
    const inserted = await Event.insertMany(events, { ordered: false });
    await recalculateAllConflicts(Event);

    res.status(201).json({
      message: `Successfully imported ${inserted.length} events`,
      count: inserted.length,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function downloadEventsExcel(req, res) {
  try {
    const { startDate, endDate, venue, society } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.startDate = { $lte: endDate || '9999-12-31' };
      query.endDate = { $gte: startDate || '0000-01-01' };
    }
    if (venue) query.venue = { $regex: venue, $options: 'i' };
    if (society) query.society = { $regex: society, $options: 'i' };

    const events = await Event.find(query).sort({ startDate: 1, startTime: 1, society: 1 });
    const buffer = generateEventsExport(events);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="tentative-calendar-events.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { verifyPassword, downloadTemplate, downloadEventsExcel, uploadExcel };
