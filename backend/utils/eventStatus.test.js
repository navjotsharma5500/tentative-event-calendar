const test = require('node:test');
const assert = require('node:assert/strict');
const { getEventStatus } = require('./eventStatus');

// All "now" instants below are expressed as IST wall-clock time and converted
// to a real UTC Date via the -05:30 offset, so these tests are deterministic
// regardless of the timezone of the machine running them.
function ist(y, m, d, hh, mm, ss = 0) {
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss) - (5 * 60 + 30) * 60000);
}

test('overnight event: mid-slot (started previous day) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 48)), 'Live');
});

test('daytime event: within today\'s slot is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 15, 0)), 'Live');
});

test('daytime event: after today\'s slot with future dates remaining is Active', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 18, 0)), 'Active');
});

test('multi-day event: before today\'s daily start time is Upcoming, not Active', () => {
  const event = { startDate: '2026-09-10', endDate: '2026-09-13', startTime: '17:00', endTime: '20:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 48)), 'Upcoming');
});

test('final date: exactly at end time is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 17, 0, 0)), 'Live');
});

test('final date: one second after end time is Completed', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 17, 0, 1)), 'Completed');
});

test('zero-duration event (startTime === endTime) is Completed shortly after', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '08:00', endTime: '08:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 47)), 'Completed');
});

test('zero-duration event is Live at the exact instant', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '08:00', endTime: '08:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 0, 0)), 'Live');
});

test('single-day event: before start time is Upcoming', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 7, 59)), 'Upcoming');
});

test('single-day event: exactly at start time is Live', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 0)), 'Live');
});

test('overnight event: 23:00 (still today\'s occurrence) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 23, 0)), 'Live');
});

test('overnight event: 01:00 (continuation of previous day) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 1, 0)), 'Live');
});

test('overnight event: 03:00 gap (previous occurrence ended, next hasn\'t started) is Upcoming', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 3, 0)), 'Upcoming');
});

test('overnight event: first day before start time has no previous-day carryover, is Upcoming', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 1, 0)), 'Upcoming');
});

test('overnight event: final date at 01:00 (before recorded cutoff) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 14, 1, 0)), 'Live');
});

test('overnight event: final date exactly at cutoff (02:00) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 14, 2, 0, 0)), 'Live');
});

test('overnight event: after final cutoff is Completed, does not start a new 08:00 occurrence', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 14, 2, 0, 1)), 'Completed');
  assert.equal(getEventStatus(event, ist(2026, 9, 14, 9, 0)), 'Completed');
});

test('before the start date is Upcoming', () => {
  const event = { startDate: '2026-09-10', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 9, 23, 59)), 'Upcoming');
});

test('after the final date is Completed', () => {
  const event = { startDate: '2026-09-10', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 15, 0, 0)), 'Completed');
});

test('same-date overnight record (legacy single-date entry) rolls its cutoff into the next morning', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '22:00', endTime: '02:00' };
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 21, 59)), 'Upcoming');
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 23, 0)), 'Live');
  assert.equal(getEventStatus(event, ist(2026, 9, 13, 1, 0)), 'Live');
  assert.equal(getEventStatus(event, ist(2026, 9, 13, 2, 0, 0)), 'Live');
  assert.equal(getEventStatus(event, ist(2026, 9, 13, 2, 0, 1)), 'Completed');
});

test('status is computed in IST regardless of the host machine timezone assumptions', () => {
  // 2026-09-12T18:31:00Z is 2026-09-13T00:01:00 IST -- just after midnight IST,
  // which would be a different calendar day than plain UTC getters would report.
  const event = { startDate: '2026-09-13', endDate: '2026-09-13', startTime: '00:00', endTime: '23:59' };
  const now = new Date('2026-09-12T18:31:00.000Z');
  assert.equal(getEventStatus(event, now), 'Live');
});
