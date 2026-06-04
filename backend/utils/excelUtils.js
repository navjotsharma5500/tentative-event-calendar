const XLSX = require('xlsx');

function generateTemplate() {
  const wb = XLSX.utils.book_new();
  const headers = ['Society', 'Event', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Venue', 'Description'];
  const sampleRow = [
    'Computer Science Society', 'Annual Hackathon',
    '2025-09-15', '09:00', '2025-09-15', '18:00',
    'Main Auditorium', 'Annual hackathon event with prizes',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  ws['!cols'] = [
    { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
    { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Events');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function parseExcelFile(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('Excel file has no sheets');

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rows.length < 2) throw new Error('Excel file has no data rows');

  const headers = rows[0].map((h) => String(h).trim().toLowerCase());
  const requiredHeaders = ['society', 'event', 'start date', 'start time', 'end date', 'end time', 'venue'];

  const colMap = {};
  for (const required of requiredHeaders) {
    const idx = headers.indexOf(required);
    if (idx === -1) throw new Error(`Missing required column: "${required}"`);
    colMap[required] = idx;
  }
  const descIdx = headers.indexOf('description');

  const events = [];
  const errors = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((cell) => cell === '' || cell === null || cell === undefined)) continue;

    const rowNum = i + 1;
    const rowErrors = [];

    const society = String(row[colMap['society']] || '').trim();
    const event = String(row[colMap['event']] || '').trim();
    const startDate = normalizeDate(row[colMap['start date']]);
    const startTime = normalizeTime(row[colMap['start time']]);
    const endDate = normalizeDate(row[colMap['end date']]);
    const endTime = normalizeTime(row[colMap['end time']]);
    const venue = String(row[colMap['venue']] || '').trim();
    const description = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';

    if (!society) rowErrors.push('Society is required');
    if (!event) rowErrors.push('Event name is required');
    if (!startDate) rowErrors.push('Start Date is invalid (use YYYY-MM-DD)');
    if (!startTime) rowErrors.push('Start Time is invalid (use HH:MM)');
    if (!endDate) rowErrors.push('End Date is invalid (use YYYY-MM-DD)');
    if (!endTime) rowErrors.push('End Time is invalid (use HH:MM)');
    if (!venue) rowErrors.push('Venue is required');

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, errors: rowErrors });
      continue;
    }

    events.push({ society, event, startDate, startTime, endDate, endTime, venue, description });
  }

  if (errors.length > 0) {
    const errorMsg = errors.map((e) => `Row ${e.row}: ${e.errors.join(', ')}`).join('\n');
    throw new Error(`Validation errors:\n${errorMsg}`);
  }

  if (events.length === 0) throw new Error('No valid events found in the Excel file');

  return events;
}

function normalizeDate(val) {
  if (!val && val !== 0) return null;

  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (!date) return null;
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }

  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();

  const ymd = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;

  const dmy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  return null;
}

function normalizeTime(val) {
  if (!val && val !== 0) return null;

  if (typeof val === 'number' && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const str = String(val).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;

  const ampm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = ampm[2];
    const period = ampm[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  return null;
}

module.exports = { generateTemplate, parseExcelFile };
