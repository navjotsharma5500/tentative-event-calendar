const Event = require('../models/Event');
const { recalculateAllConflicts } = require('../utils/conflictDetection');

function getEventStatus(event) {
  const now = new Date();
  const start = new Date(`${event.startDate}T${event.startTime}:00`);
  const end = new Date(`${event.endDate}T${event.endTime}:00`);

  if (now > end) return 'Completed';
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Live';

  const today = now.toISOString().split('T')[0];
  if (today >= event.startDate && today <= event.endDate) return 'Active';

  return 'Upcoming';
}

async function getAllEvents(req, res) {
  try {
    const { search, society, venue, status, conflictOnly } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { event: { $regex: search, $options: 'i' } },
        { society: { $regex: search, $options: 'i' } },
      ];
    }
    if (society) query.society = { $regex: society, $options: 'i' };
    if (venue) query.venue = { $regex: venue, $options: 'i' };
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

    const enriched = events.map((ev) => ({ ...ev.toObject(), status: getEventStatus(ev) }));
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

      if (dayEvents.length > 0) {
        dateMap[dateStr] = {
          hasEvent: true,
          hasConflict: dayEvents.some((ev) => ev.conflict),
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
  getCalendarMonth, createEvent, updateEvent, deleteEvent, importEvents,
};
