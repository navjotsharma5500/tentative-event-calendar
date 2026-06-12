const Event = require('../models/Event');
const { doEventsOverlapOnDate, recalculateAllConflicts } = require('../utils/conflictDetection');

function toLocalDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMinutes(timeStr) {
  const [hours = 0, minutes = 0] = (timeStr || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getEventStatus(event) {
  const now = new Date();
  const today = toLocalDateStr(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (today > event.endDate) return 'Completed';
  if (today < event.startDate) return 'Upcoming';

  const startMinutes = toMinutes(event.startTime);
  const endMinutes = toMinutes(event.endTime);
  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return 'Live';

  return 'Active';
}

function addDateConflict(events, date) {
  return events.map((ev, index) => {
    const eventObject = ev.toObject ? ev.toObject() : ev;
    const dateConflict = events.some((other, otherIndex) => (
      index !== otherIndex && doEventsOverlapOnDate(ev, other, date)
    ));

    return {
      ...eventObject,
      conflictOverall: eventObject.conflict,
      conflict: dateConflict,
      dateConflict,
      status: getEventStatus(ev),
    };
  });
}

async function getAllEvents(req, res) {
  try {
    const { search, society, department, venue, status, conflictOnly, startDate, endDate } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { event: { $regex: search, $options: 'i' } },
        { society: { $regex: search, $options: 'i' } },
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

    let events = await Event.find(query).sort({ startDate: 1, startTime: 1 });

    if (status) events = events.filter((ev) => getEventStatus(ev) === status);

    const enriched = events.map((ev) => ({ ...ev.toObject(), status: getEventStatus(ev) }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getVenues(req, res) {
  try {
    const venues = await Event.distinct('venue');
    res.json(venues.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getSocieties(req, res) {
  try {
    const societies = await Event.distinct('society');
    res.json(societies.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getEventsByDate(req, res) {
  try {
    const { date } = req.params;
    const events = await Event.find({
      startDate: { $lte: date },
      endDate: { $gte: date },
    }).sort({ startTime: 1 });

    const enriched = addDateConflict(events, date);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCalendarMonth(req, res) {
  try {
    const { year, month } = req.params;
    const y = parseInt(year);
    const m = parseInt(month);

    const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate().toString().padStart(2, '0')}`;

    const events = await Event.find({
      startDate: { $lte: lastDay },
      endDate: { $gte: firstDay },
    });

    const dateMap = {};
    const daysInMonth = new Date(y, m, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter((ev) => ev.startDate <= dateStr && ev.endDate >= dateStr);
      const hasConflict = dayEvents.some((ev, index) => (
        dayEvents.some((other, otherIndex) => (
          index !== otherIndex && doEventsOverlapOnDate(ev, other, dateStr)
        ))
      ));

      if (dayEvents.length > 0) {
        dateMap[dateStr] = {
          hasEvent: true,
          hasConflict,
          count: dayEvents.length,
        };
      }
    }

    res.json(dateMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createEvent(req, res) {
  try {
    const event = new Event(req.body);
    await event.save();
    await recalculateAllConflicts(Event);
    const updated = await Event.findById(event._id);
    res.status(201).json({ ...updated.toObject(), status: getEventStatus(updated) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateEvent(req, res) {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    await recalculateAllConflicts(Event);
    const fresh = await Event.findById(updated._id);
    res.json({ ...fresh.toObject(), status: getEventStatus(fresh) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    await recalculateAllConflicts(Event);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function ignoreEventConflict(req, res) {
  try {
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { ignoreConflict: true, conflict: false, conflictWith: [] },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    await recalculateAllConflicts(Event);
    const fresh = await Event.findById(updated._id);
    res.json({ ...fresh.toObject(), status: getEventStatus(fresh) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function importEvents(req, res) {
  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }
    const inserted = await Event.insertMany(events, { ordered: false });
    await recalculateAllConflicts(Event);
    res.status(201).json({ message: `Successfully imported ${inserted.length} events`, count: inserted.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getAllEvents, getVenues, getSocieties, getEventsByDate,
  getCalendarMonth, createEvent, updateEvent, deleteEvent, ignoreEventConflict, importEvents,
};
