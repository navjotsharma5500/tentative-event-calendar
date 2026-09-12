// Single source of truth for event lifecycle status (backend).
// All lifecycle decisions are made in Asia/Kolkata (IST), regardless of
// the server's own timezone, since Date#getTime() is timezone-agnostic
// and only the *display* getters (getHours/getDate/...) are local-timezone
// dependent. We instead shift the instant by the fixed IST offset and read
// it back with the UTC getters, which gives deterministic IST wall-clock
// values no matter where this code runs.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function pad(n) {
  return String(n).padStart(2, '0');
}

function toMinutes(timeStr) {
  const [hours = 0, minutes = 0] = (timeStr || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
}

function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d };
}

// Returns the same numeric timeline used by `shiftedMsFromNow`, so the two
// are directly comparable: a UTC-based ms value that represents the given
// IST calendar date + minute-of-day as if it were UTC.
function dateAndMinutesToShiftedMs(dateStr, minutesOfDay) {
  const { y, m, d } = parseDateStr(dateStr);
  return Date.UTC(y, m - 1, d, 0, 0, 0, 0) + minutesOfDay * 60000;
}

function addDaysToDateStr(dateStr, days) {
  const { y, m, d } = parseDateStr(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d) + days * 86400000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function shiftedMsFromNow(now) {
  return now.getTime() + IST_OFFSET_MS;
}

function getISTDateStr(shiftedMs) {
  const shifted = new Date(shiftedMs);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/**
 * Computes the lifecycle status of an event: Upcoming, Live, Active, or Completed.
 * See backend/utils/eventStatus.test.js for the full truth table this implements.
 *
 * @param {{startDate: string, endDate: string, startTime: string, endTime: string}} event
 * @param {Date} [now] - defaults to the current instant; pass a fixed Date for tests.
 */
function getEventStatus(event, now = new Date()) {
  const nowMs = shiftedMsFromNow(now);
  const today = getISTDateStr(nowMs);

  const startMin = toMinutes(event.startTime);
  const endMin = toMinutes(event.endTime);
  const overnight = endMin < startMin;

  const eventStartMs = dateAndMinutesToShiftedMs(event.startDate, startMin);

  // A same-date overnight record (startDate === endDate, endTime < startTime)
  // has no way to represent "ends the next morning" other than implicitly:
  // the recorded end time is only reachable by rolling into the following
  // calendar day. For genuine multi-day events the recorded endDate/endTime
  // is used exactly as-is (no rollover) per the final-cutoff rule.
  const cutoffEndDate = overnight && event.startDate === event.endDate
    ? addDaysToDateStr(event.endDate, 1)
    : event.endDate;
  const finalCutoffMs = dateAndMinutesToShiftedMs(cutoffEndDate, endMin);

  if (nowMs < eventStartMs) return 'Upcoming';
  if (nowMs > finalCutoffMs) return 'Completed';

  if (overnight) {
    const yesterday = addDaysToDateStr(today, -1);
    const yesterdayStartMs = dateAndMinutesToShiftedMs(yesterday, startMin);
    const yesterdayEndMs = dateAndMinutesToShiftedMs(today, endMin);
    if (nowMs >= yesterdayStartMs && nowMs <= yesterdayEndMs) return 'Live';
  }

  const todayStartMs = dateAndMinutesToShiftedMs(today, startMin);
  const todayEndMs = overnight
    ? dateAndMinutesToShiftedMs(addDaysToDateStr(today, 1), endMin)
    : dateAndMinutesToShiftedMs(today, endMin);

  if (nowMs >= todayStartMs && nowMs <= todayEndMs) return 'Live';
  if (nowMs < todayStartMs) return 'Upcoming';
  return 'Active';
}

module.exports = { getEventStatus };
