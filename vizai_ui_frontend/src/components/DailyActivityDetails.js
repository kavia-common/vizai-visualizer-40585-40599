import React, { useMemo, useState, useEffect } from 'react';
import { computePerBehaviorMetrics, buildHourlySeries, findPeakHours, formatMs } from '../utils/metrics';
import { getMockActivitiesForDate, mockBehaviors, mockColors } from '../utils/mockDailyActivities';
import HourlyBreakdownChart from './HourlyBreakdownChart';

// Neon Fun utility styles
const cardClass = "rounded-2xl p-4 md:p-6 bg-white shadow-md";
const sectionTitle = "text-lg md:text-xl font-semibold text-gray-800";
const neonHeaderGradient = "bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400";
const pillClass = "px-3 py-1 rounded-full text-xs font-medium";

function startOfDayISO(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d.toISOString();
}
function endOfDayISO(date) {
  const d = new Date(date);
  d.setHours(23,59,59,999);
  return d.toISOString();
}

// PUBLIC_INTERFACE
export default function DailyActivityDetails() {
  /**
   * Daily Activity Details page:
   * - Shows per-behavior totals, total durations, avg duration/occurrence, % of day
   * - Hour-by-hour stacked visualization
   * - Peak activity times listed/highlighted
   * Data source uses mock data; can be swapped with API via REACT_APP_API_BASE.
   */
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  });
  const [selectedBehaviors, setSelectedBehaviors] = useState(mockBehaviors);

  // Fetch data (mock)
  const activities = useMemo(() => getMockActivitiesForDate(selectedDate), [selectedDate]);

  // Filter by behaviors
  const filteredActivities = useMemo(() => {
    return activities.filter(a => selectedBehaviors.includes(a.behavior || 'Unknown'));
  }, [activities, selectedBehaviors]);

  const dayStartISO = useMemo(() => startOfDayISO(selectedDate), [selectedDate]);
  const dayEndISO = useMemo(() => endOfDayISO(selectedDate), [selectedDate]);

  const perBehavior = useMemo(() => computePerBehaviorMetrics(filteredActivities, dayStartISO, dayEndISO), [filteredActivities, dayStartISO, dayEndISO]);
  const hourly = useMemo(() => buildHourlySeries(filteredActivities, dayStartISO), [filteredActivities, dayStartISO]);
  const peakByDuration = useMemo(() => findPeakHours(hourly, { by: 'duration', topN: 3 }), [hourly]);
  const peakByOccurrences = useMemo(() => findPeakHours(hourly, { by: 'occurrences', topN: 3 }), [hourly]);

  // Build legend/order with selected behaviors
  const legendBehaviors = useMemo(() => selectedBehaviors, [selectedBehaviors]);
  const highlight = useMemo(() => peakByDuration.map(p => p.hour), [peakByDuration]);

  // Accessible colors for current selection
  const colors = useMemo(() => {
    const map = { ...mockColors };
    selectedBehaviors.forEach(b => {
      if (!map[b]) map[b] = '#999';
    });
    return map;
  }, [selectedBehaviors]);

  // Handle behavior toggle
  const toggleBehavior = (b) => {
    setSelectedBehaviors(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  // Metrics table rows
  const rows = useMemo(() => {
    const entries = Object.values(perBehavior.byBehavior);
    entries.sort((a, b) => b.totalDurationMs - a.totalDurationMs);
    return entries;
  }, [perBehavior]);

  useEffect(() => {
    // Ensure at least one behavior selected
    if (selectedBehaviors.length === 0) setSelectedBehaviors(mockBehaviors);
  }, [selectedBehaviors]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0FDF4' }}>
      {/* Header */}
      <div className={`w-full h-28 ${neonHeaderGradient} flex items-center justify-between px-4 md:px-8 rounded-b-3xl`}>
        <div className="text-white">
          <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow">Daily Activity Details</h1>
          <p className="text-white/90 text-sm">Playful insights for the selected day</p>
        </div>
        <div>
          <span className={`${pillClass} bg-white/30 text-white backdrop-blur`}>Neon Fun</span>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10">
        <div className={`${cardClass}`}>
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter behaviors</label>
              <div className="flex flex-wrap gap-2">
                {mockBehaviors.map(b => {
                  const active = selectedBehaviors.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => toggleBehavior(b)}
                      className={`${pillClass} ${active ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      style={{ borderColor: colors[b] }}
                    >
                      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: colors[b] }} />
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className={`${cardClass}`}>
            <h2 className={sectionTitle}>Per-Behavior Summary</h2>
            <div className="overflow-x-auto mt-3">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Behavior</th>
                    <th className="py-2">Occurrences</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Avg/Occ</th>
                    <th className="py-2">% Day</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.behavior} className="border-t border-gray-100">
                      <td className="py-2">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3 h-3 rounded" style={{ backgroundColor: colors[r.behavior] }} />
                          <span className="font-medium text-gray-800">{r.behavior}</span>
                        </span>
                      </td>
                      <td className="py-2 text-gray-800">{r.occurrences}</td>
                      <td className="py-2 text-gray-800">{formatMs(r.totalDurationMs)}</td>
                      <td className="py-2 text-gray-800">{formatMs(r.avgDurationMs)}</td>
                      <td className="py-2 text-gray-800">{r.percentOfDay.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan="5" className="py-4 text-center text-gray-500">No data for selected filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`${cardClass}`}>
            <h2 className={sectionTitle}>Peak Hours (Duration)</h2>
            <ul className="mt-3 space-y-2">
              {peakByDuration.map(p => (
                <li key={p.hour} className="flex items-center justify-between">
                  <span className="text-gray-700">Hour {String(p.hour).padStart(2,'0')}:00</span>
                  <span className={`${pillClass} bg-emerald-50 text-emerald-700`}>{formatMs(p.total)}</span>
                </li>
              ))}
              {peakByDuration.length === 0 && <li className="text-gray-500">No peaks</li>}
            </ul>
            <h2 className={`${sectionTitle} mt-6`}>Peak Hours (Occurrences)</h2>
            <ul className="mt-3 space-y-2">
              {peakByOccurrences.map(p => (
                <li key={p.hour} className="flex items-center justify-between">
                  <span className="text-gray-700">Hour {String(p.hour).padStart(2,'0')}:00</span>
                  <span className={`${pillClass} bg-amber-50 text-amber-700`}>{p.total} occ</span>
                </li>
              ))}
              {peakByOccurrences.length === 0 && <li className="text-gray-500">No peaks</li>}
            </ul>
          </div>

          <div className={`${cardClass}`}>
            <h2 className={sectionTitle}>Day Overview</h2>
            <div className="mt-3 text-gray-700 space-y-2">
              <div>Total Day Length: 24:00</div>
              <div>Selected Date: <span className="font-medium">{selectedDate}</span></div>
              <div>Behaviors: <span className="font-medium">{selectedBehaviors.join(', ')}</span></div>
              <div className="pt-2">
                <span className={`${pillClass} bg-white border border-gray-200 text-gray-700`}>Data Source: Mock</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Breakdown */}
        <div className={`${cardClass} mt-6`}>
          <h2 className={sectionTitle}>Hourly Breakdown</h2>
          <p className="text-sm text-gray-600">Stacked duration per hour with tooltip on hover. Peak hours highlighted.</p>
          <div className="mt-4">
            <HourlyBreakdownChart
              series={hourly}
              colors={colors}
              legendBehaviors={legendBehaviors}
              highlightHours={highlight}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
