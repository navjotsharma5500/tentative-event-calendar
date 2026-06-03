function toDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function doEventsOverlap(eventA, eventB) {
  if (eventA.venue.trim().toLowerCase() !== eventB.venue.trim().toLowerCase()) {
    return false;
  }

  const startA = toDateTime(eventA.startDate, eventA.startTime);
  const endA = toDateTime(eventA.endDate, eventA.endTime);
  const startB = toDateTime(eventB.startDate, eventB.startTime);
  const endB = toDateTime(eventB.endDate, eventB.endTime);

  return startA < endB && endA > startB;
}

function computeConflicts(events) {
  const result = {};
  for (const ev of events) {
    result[ev._id.toString()] = { conflict: false, conflictWith: [] };
  }

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (doEventsOverlap(events[i], events[j])) {
        const idA = events[i]._id.toString();
        const idB = events[j]._id.toString();
        result[idA].conflict = true;
        result[idA].conflictWith.push(events[j]._id);
        result[idB].conflict = true;
        result[idB].conflictWith.push(events[i]._id);
      }
    }
  }

  return result;
}

async function recalculateAllConflicts(Event) {
  const allEvents = await Event.find({});
  const conflictMap = computeConflicts(allEvents);

  const bulkOps = allEvents.map((ev) => ({
    updateOne: {
      filter: { _id: ev._id },
      update: {
        $set: {
          conflict: conflictMap[ev._id.toString()].conflict,
          conflictWith: conflictMap[ev._id.toString()].conflictWith,
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await Event.bulkWrite(bulkOps);
  }
}

module.exports = { doEventsOverlap, computeConflicts, recalculateAllConflicts };
