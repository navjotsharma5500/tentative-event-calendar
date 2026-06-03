const { generateTemplate, parseExcelFile } = require('../utils/excelUtils');
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

module.exports = { verifyPassword, downloadTemplate, uploadExcel };
