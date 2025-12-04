/**
 * Mock data for Daily Activity Details
 * Data shape matches metrics.js docs.
 * Replace with API call later. Base URL (if used): process.env.REACT_APP_API_BASE
 */
const todayISO = new Date();
todayISO.setHours(0,0,0,0);
const baseDay = new Date(todayISO);

function isoWithOffset(hStart, mStart, hEnd, mEnd, behavior) {
  const s = new Date(baseDay);
  s.setHours(hStart, mStart, 0, 0);
  const e = new Date(baseDay);
  e.setHours(hEnd, mEnd, 0, 0);
  return { id: `${behavior}-${s.getTime()}`, behavior, start: s.toISOString(), end: e.toISOString() };
}

export const mockBehaviors = ['Foraging', 'Resting', 'Grooming', 'Exploring'];

export const mockColors = {
  Foraging: '#34D399',   // emerald-400
  Resting: '#60A5FA',    // blue-400
  Grooming: '#F59E0B',   // amber-500
  Exploring: '#F472B6',  // pink-400
  Unknown: '#A78BFA'     // violet-400
};

// Example events throughout the day
export function getMockActivitiesForDate(dateISO) {
  // We ignore dateISO and reuse the same patterns, but in real API we would fetch by date.
  return [
    isoWithOffset(1, 10, 1, 45, 'Foraging'),
    isoWithOffset(2, 5, 2, 25, 'Grooming'),
    isoWithOffset(3, 0, 5, 0, 'Resting'),
    isoWithOffset(6, 0, 6, 30, 'Exploring'),
    isoWithOffset(8, 15, 8, 50, 'Foraging'),
    isoWithOffset(9, 5, 9, 35, 'Grooming'),
    isoWithOffset(10, 0, 12, 0, 'Resting'),
    isoWithOffset(13, 10, 13, 40, 'Exploring'),
    isoWithOffset(14, 0, 14, 20, 'Foraging'),
    isoWithOffset(15, 30, 16, 0, 'Grooming'),
    isoWithOffset(18, 0, 20, 0, 'Resting'),
    isoWithOffset(21, 10, 21, 55, 'Exploring'),
  ];
}
