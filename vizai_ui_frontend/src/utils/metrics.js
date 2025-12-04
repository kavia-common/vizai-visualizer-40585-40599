//
// Neon Fun - Metrics utilities for Daily Activity Details
// Data shape (mock/API):
// activities: Array<{
//   id: string,
//   behavior: string, // e.g., "Foraging", "Resting"
//   start: string,    // ISO date/time
//   end: string,      // ISO date/time
// }>
// Assumptions: activities belong to the same selected day; behavior filter may limit which behaviors to include.
//
// Exposed helpers:
// - computePerBehaviorMetrics(activities, dayStartISO, dayEndISO)
// - buildHourlySeries(activities, dayStartISO)
// - findPeakHours(hourlySeries, { by: 'duration' | 'occurrences', topN: number })
//
// PUBLIC_INTERFACE
export function computePerBehaviorMetrics(activities, dayStartISO, dayEndISO) {
  /** Compute per-behavior totals, durations, average durations, and % of day.
   * @param {Array} activities - activity records
   * @param {string} dayStartISO - ISO string for 00:00 of day
   * @param {string} dayEndISO - ISO string for 23:59:59.999 of day
   * @returns {{
   *  byBehavior: Record<string, {
   *    behavior: string,
   *    occurrences: number,
   *    totalDurationMs: number,
   *    avgDurationMs: number,
   *    percentOfDay: number
   *  }>,
   *  totalDayMs: number
   * }}
   */
  const byBehavior = {};
  const dayStart = new Date(dayStartISO).getTime();
  const dayEnd = new Date(dayEndISO).getTime();
  const totalDayMs = Math.max(0, dayEnd - dayStart);

  activities.forEach(a => {
    const s = new Date(a.start).getTime();
    const e = new Date(a.end).getTime();
    const clippedStart = Math.max(dayStart, s);
    const clippedEnd = Math.min(dayEnd, e);
    const dur = Math.max(0, clippedEnd - clippedStart);
    const key = a.behavior || 'Unknown';
    if (!byBehavior[key]) {
      byBehavior[key] = { behavior: key, occurrences: 0, totalDurationMs: 0, avgDurationMs: 0, percentOfDay: 0 };
    }
    byBehavior[key].occurrences += 1;
    byBehavior[key].totalDurationMs += dur;
  });

  Object.values(byBehavior).forEach(b => {
    b.avgDurationMs = b.occurrences > 0 ? b.totalDurationMs / b.occurrences : 0;
    b.percentOfDay = totalDayMs > 0 ? (b.totalDurationMs / totalDayMs) * 100 : 0;
  });

  return { byBehavior, totalDayMs };
}

// PUBLIC_INTERFACE
export function buildHourlySeries(activities, dayStartISO) {
  /** Build hour-by-hour totals per behavior and total occurrences/durations.
   * @param {Array} activities
   * @param {string} dayStartISO - ISO string at 00:00 of selected day
   * @returns {{
   *   hours: Array<{
   *     hour: number,
   *     totalsByBehavior: Record<string, { durationMs: number, occurrences: number }>,
   *     totalDurationMs: number,
   *     totalOccurrences: number
   *   }>
   * }}
   */
  const dayStart = new Date(dayStartISO);
  const hours = new Array(24).fill(null).map((_, i) => ({
    hour: i,
    totalsByBehavior: {},
    totalDurationMs: 0,
    totalOccurrences: 0
  }));

  activities.forEach(a => {
    const s = new Date(a.start);
    const e = new Date(a.end);
    // Iterate through each hour the activity overlaps
    let cursor = new Date(s);
    // Align cursor to start of its hour
    cursor.setMinutes(0, 0, 0);
    while (cursor <= e) {
      const hourIdx = cursor.getHours();
      // hour window
      const hourStart = new Date(cursor);
      const hourEnd = new Date(cursor);
      hourEnd.setHours(hourEnd.getHours() + 1);

      // overlap in this hour
      const overlapStart = new Date(Math.max(s.getTime(), hourStart.getTime()));
      const overlapEnd = new Date(Math.min(e.getTime(), hourEnd.getTime()));
      const overlapMs = Math.max(0, overlapEnd - overlapStart);

      if (overlapMs > 0) {
        const behavior = a.behavior || 'Unknown';
        const bucket = hours[hourIdx];
        if (!bucket.totalsByBehavior[behavior]) {
          bucket.totalsByBehavior[behavior] = { durationMs: 0, occurrences: 0 };
        }
        bucket.totalsByBehavior[behavior].durationMs += overlapMs;
        // Count an occurrence if the start is within this hour
        if (s >= hourStart && s < hourEnd) {
          bucket.totalsByBehavior[behavior].occurrences += 1;
          bucket.totalOccurrences += 1;
        }
        bucket.totalDurationMs += overlapMs;
      }

      // advance to next hour
      cursor.setHours(cursor.getHours() + 1);
    }
  });

  return { hours };
}

// PUBLIC_INTERFACE
export function findPeakHours(hourlySeries, options = { by: 'duration', topN: 3 }) {
  /** Find peak activity hours by total duration or total occurrences.
   * @param {{hours: Array}} hourlySeries
   * @param {{by: 'duration'|'occurrences', topN: number}} options
   * @returns {Array<{ hour: number, total: number }>}
   */
  const by = options.by || 'duration';
  const topN = options.topN || 3;
  const arr = hourlySeries.hours.map(h => ({
    hour: h.hour,
    total: by === 'occurrences' ? h.totalOccurrences : h.totalDurationMs
  }));
  arr.sort((a, b) => b.total - a.total);
  return arr.slice(0, topN);
}

// PUBLIC_INTERFACE
export function formatMs(ms) {
  /** Human readable mm:ss for short durations; hh:mm if long */
  if (ms <= 0 || !isFinite(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
