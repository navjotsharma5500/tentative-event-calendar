import test from 'node:test'
import assert from 'node:assert/strict'
import { getEventStatus } from './eventStatus.js'

// All "now" instants below are expressed as IST wall-clock time and converted
// to a real UTC Date via the -05:30 offset, so these tests are deterministic
// regardless of the timezone of the machine running them.
function ist(y, m, d, hh, mm, ss = 0) {
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss) - (5 * 60 + 30) * 60000)
}

test('overnight event: mid-slot (started previous day) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 48)), 'Live')
})

test('daytime event: within today\'s slot is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 15, 0)), 'Live')
})

test('daytime event: after today\'s slot with future dates remaining is Active', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 18, 0)), 'Active')
})

test('multi-day event: before today\'s daily start time is Upcoming, not Active', () => {
  const event = { startDate: '2026-09-10', endDate: '2026-09-13', startTime: '17:00', endTime: '20:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 48)), 'Upcoming')
})

test('final date: exactly at end time is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 17, 0, 0)), 'Live')
})

test('final date: one second after end time is Completed', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 17, 0, 1)), 'Completed')
})

test('zero-duration event (startTime === endTime) is Completed shortly after', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '08:00', endTime: '08:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 47)), 'Completed')
})

test('single-day event: before start time is Upcoming', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 7, 59)), 'Upcoming')
})

test('single-day event: exactly at start time is Live', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-12', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 8, 0)), 'Live')
})

test('overnight event: 23:00 (still today\'s occurrence) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 23, 0)), 'Live')
})

test('overnight event: 01:00 (continuation of previous day) is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 1, 0)), 'Live')
})

test('overnight event: 03:00 gap is Upcoming', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 3, 0)), 'Upcoming')
})

test('overnight event: first day before start time is Upcoming (no previous-day carryover)', () => {
  const event = { startDate: '2026-09-12', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 1, 0)), 'Upcoming')
})

test('overnight event: final date at 01:00 is Live', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 14, 1, 0)), 'Live')
})

test('overnight event: after final cutoff is Completed', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '02:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 14, 2, 0, 1)), 'Completed')
})

test('before the start date is Upcoming', () => {
  const event = { startDate: '2026-09-10', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 9, 23, 59)), 'Upcoming')
})

test('after the final date is Completed', () => {
  const event = { startDate: '2026-09-10', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 15, 0, 0)), 'Completed')
})

test('changing `now` changes status without touching event data', () => {
  const event = { startDate: '2026-09-07', endDate: '2026-09-14', startTime: '08:00', endTime: '17:00' }
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 7, 0)), 'Upcoming')
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 12, 0)), 'Live')
  assert.equal(getEventStatus(event, ist(2026, 9, 12, 18, 0)), 'Active')
})

test('status is computed in IST regardless of the host machine timezone', () => {
  const event = { startDate: '2026-09-13', endDate: '2026-09-13', startTime: '00:00', endTime: '23:59' }
  const now = new Date('2026-09-12T18:31:00.000Z')
  assert.equal(getEventStatus(event, now), 'Live')
})
