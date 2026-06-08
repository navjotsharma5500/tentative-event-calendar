function normalizeVenue(venue) {
  return (venue || '').trim().toLowerCase();
}

function toMinutes(timeStr) {
  const [hours = 0, minutes = 0] = (timeStr || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
}

function doDateRangesOverlap(eventA, eventB) {
  return eventA.startDate <= eventB.endDate && eventA.endDate >= eventB.startDate;
}

function doDailyTimesOverlap(eventA, eventB) {
  const startA = toMinutes(eventA.startTime);
  const endA = toMinutes(eventA.endTime);
  const startB = toMinutes(eventB.startTime);
  const endB = toMinutes(eventB.endTime);

  return startA < endB && endA > startB;
}

function doEventsOverlap(eventA, eventB) {
  if (eventA.ignoreConflict || eventB.ignoreConflict) {
    return false;
  }

  if (normalizeVenue(eventA.venue) !== normalizeVenue(eventB.venue)) {
    return false;
  }

  return doDateRangesOverlap(eventA, eventB) && doDailyTimesOverlap(eventA, eventB);
}

function doEventsOverlapOnDate(eventA, eventB, dateStr) {
  if (eventA.ignoreConflict || eventB.ignoreConflict) {
    return false;
  }

  if (normalizeVenue(eventA.venue) !== normalizeVenue(eventB.venue)) {
    return false;
  }

  const eventAIncludesDate = eventA.startDate <= dateStr && eventA.endDate >= dateStr;
  const eventBIncludesDate = eventB.startDate <= dateStr && eventB.endDate >= dateStr;

  return eventAIncludesDate && eventBIncludesDate && doDailyTimesOverlap(eventA, eventB);
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

module.exports = {
  doEventsOverlap,
  doEventsOverlapOnDate,
  computeConflicts,
  recalculateAllConflicts,
};
