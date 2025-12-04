import React, { useMemo, useState, useEffect } from 'react';
import { useFilters } from '../context/FiltersContext';

// Neon Fun palette
const COLORS = {
  primary: '#10B981',
  secondary: '#F59E0B',
  surface: '#FFFFFF',
  text: '#374151',
  border: 'var(--border, #E5E7EB)',
  shadow: 'var(--shadow, 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1))',
};

// Compact card container for the sidebar
const cardStyle = {
  background: 'var(--surface)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  boxShadow: COLORS.shadow,
  padding: 12, // tighter padding
};

// Compact input style (smaller padding/font)
const inputBase = {
  width: '100%',
  background: 'var(--surface)',
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  padding: '6px 10px', // compact
  borderRadius: 10,
  marginTop: 4,
  boxShadow: COLORS.shadow,
  fontSize: 12, // compact font
  lineHeight: 1.3,
};

// Primary action button compact, full-width
const btnPrimary = {
  background: 'linear-gradient(135deg, #1e8a5b 0%, #34d399 100%)',
  color: '#FFFFFF',
  fontWeight: 800,
  border: 'none',
  borderRadius: 10,
  padding: '8px 10px', // compact
  cursor: 'pointer',
  boxShadow: COLORS.shadow,
  width: '100%', // full width
  fontSize: 12,
};

// Secondary action button compact, full-width
const btnSecondary = {
  background: 'transparent',
  color: COLORS.text,
  fontWeight: 800,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: '6px 10px',
  cursor: 'pointer',
  width: '100%', // full width
  fontSize: 12,
};

const labelStyle = { fontSize: 11, color: 'var(--muted)', fontWeight: 700 };

/**
 * PUBLIC_INTERFACE
 * LeftFilterSidebar - shared filter UI rendered on authenticated pages (Dashboard, Timeline, Reports).
 * Props:
 *  - availableBehaviors?: string[] (defaults to a generic list)
 *  - multiSelect?: boolean (default false)
 * Behavior:
 *  - Edits local working copy of filters; Apply commits to FiltersContext.apply()
 *  - Clear resets context via FiltersContext.clear()
 */
export default function LeftFilterSidebar({
  availableBehaviors = ['All', 'Recumbent', 'Non-Recumbent', 'Scratching', 'Self-Directed', 'Pacing', 'Moving'],
  multiSelect = false,
}) {
  const {
    behaviorType, setBehaviorType,
    dateRange, setDateRange,
    hoursRange, setHoursRange,
    selectedDate, setSelectedDate,
    period, setPeriod,
    apply, clear,
  } = useFilters();

  // local working copy so user can adjust and then Apply
  const [localBehavior, setLocalBehavior] = useState(behaviorType);
  const [localStart, setLocalStart] = useState(dateRange?.start ? toInputDate(dateRange.start) : '');
  const [localEnd, setLocalEnd] = useState(dateRange?.end ? toInputDate(dateRange.end) : '');
  const [localMinH, setLocalMinH] = useState(hoursRange?.min ?? '');
  const [localMaxH, setLocalMaxH] = useState(hoursRange?.max ?? '');
  const [localSelectedDate, setLocalSelectedDate] = useState(selectedDate ? toInputDate(selectedDate) : '');
  const [localPeriod, setLocalPeriod] = useState(period || 'weekly');

  // keep local in sync when external changes occur (e.g., pre-filters)
  useEffect(() => { setLocalBehavior(behaviorType); }, [behaviorType]);
  useEffect(() => {
    setLocalStart(dateRange?.start ? toInputDate(dateRange.start) : '');
    setLocalEnd(dateRange?.end ? toInputDate(dateRange.end) : '');
  }, [dateRange?.start, dateRange?.end]);
  useEffect(() => {
    setLocalMinH(hoursRange?.min ?? '');
    setLocalMaxH(hoursRange?.max ?? '');
  }, [hoursRange?.min, hoursRange?.max]);
  useEffect(() => { setLocalSelectedDate(selectedDate ? toInputDate(selectedDate) : ''); }, [selectedDate]);
  useEffect(() => { setLocalPeriod(period || 'weekly'); }, [period]);

  const onApply = () => {
    setBehaviorType(localBehavior);
    setPeriod(localPeriod);
    if (localPeriod === 'custom') {
      setDateRange({
        start: localStart ? new Date(localStart) : null,
        end: localEnd ? new Date(localEnd) : null,
      });
    }
    setHoursRange({
      min: localMinH === '' ? null : Number(localMinH),
      max: localMaxH === '' ? null : Number(localMaxH),
    });
    if (localSelectedDate) {
      const d = new Date(localSelectedDate);
      setSelectedDate(d);
      if (!localStart || !localEnd) {
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        setDateRange({ start, end });
      }
    } else {
      setSelectedDate(null);
    }
    apply();
  };

  const onClear = () => { clear(); };

  const behaviorOptions = useMemo(() => availableBehaviors, [availableBehaviors]);

  return (
    <aside
      style={{
        display: 'grid',
        gap: 10,
        width: 248,          // fixed narrow width (within 240–260px target)
        maxWidth: 260,
        minWidth: 220,
      }}
      aria-label="Global Filters"
    >
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, marginBottom: 8, color: COLORS.text, fontSize: 13 }}>Filters</div>

        {/* Single column, tight spacing */}
        <div style={{ display: 'grid', gap: 8 }}>
          {/* Behavior */}
          <div style={{ display: 'grid', gap: 4 }}>
            <label style={labelStyle}>Behavior Type</label>
            {multiSelect ? (
              <select
                multiple
                aria-label="Behavior Type"
                value={Array.isArray(localBehavior) ? localBehavior : [String(localBehavior ?? 'All')]}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(o => o.value);
                  setLocalBehavior(values);
                }}
                style={{ ...inputBase, height: 88 }}
              >
                {behaviorOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <select
                aria-label="Behavior Type"
                value={String(localBehavior ?? 'All')}
                onChange={(e) => setLocalBehavior(e.target.value)}
                style={inputBase}
              >
                {behaviorOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>

          {/* Period */}
          <div style={{ display: 'grid', gap: 4 }}>
            <label style={labelStyle}>Time Period</label>
            <select
              aria-label="Time Period"
              value={localPeriod}
              onChange={(e) => setLocalPeriod(e.target.value)}
              style={inputBase}
            >
              <option value="daily">Daily (today)</option>
              <option value="weekly">Weekly (last 7 days)</option>
              <option value="monthly">Monthly (last 30 days)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Date Range - vertical stack (no two-column grid) */}
          <div style={{ display: 'grid', gap: 4 }}>
            <label style={labelStyle}>Date Range</label>
            <input
              type="date"
              aria-label="Start date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              style={inputBase}
              disabled={localPeriod !== 'custom'}
              placeholder="Start date"
            />
            <input
              type="date"
              aria-label="End date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              style={inputBase}
              disabled={localPeriod !== 'custom'}
              placeholder="End date"
            />
          </div>

          {/* Hours Range - vertical alignment */}
          <div style={{ display: 'grid', gap: 4 }}>
            <label style={labelStyle}>Hours Range</label>
            <input
              type="number"
              placeholder="Min (0–24)"
              aria-label="Min hours"
              value={localMinH === null ? '' : localMinH}
              onChange={(e) => setLocalMinH(e.target.value)}
              style={inputBase}
              min={0}
              max={24}
            />
            <input
              type="number"
              placeholder="Max (0–24)"
              aria-label="Max hours"
              value={localMaxH === null ? '' : localMaxH}
              onChange={(e) => setLocalMaxH(e.target.value)}
              style={inputBase}
              min={0}
              max={24}
            />
          </div>

          {/* Quick Date */}
          <div style={{ display: 'grid', gap: 4 }}>
            <label style={labelStyle}>Quick Date</label>
            <input
              type="date"
              aria-label="Quick calendar date"
              value={localSelectedDate}
              onChange={(e) => {
                const v = e.target.value;
                setLocalSelectedDate(v);
                if (v) {
                  if (!localStart || !localEnd) {
                    setLocalStart(v);
                    setLocalEnd(v);
                  }
                }
              }}
              style={inputBase}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Select a single date; range auto-fills if empty.
            </div>
          </div>

          {/* Actions - full width compact buttons stacked */}
          <div style={{ display: 'grid', gap: 6, marginTop: 2 }}>
            <button onClick={onApply} style={btnPrimary} title="Apply Filters" aria-label="Apply Filters">
              Apply Filters
            </button>
            <button onClick={onClear} style={btnSecondary} title="Clear Filters" aria-label="Clear Filters">
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function toInputDate(d) {
  const dt = typeof d === 'string' ? new Date(d) : d instanceof Date ? d : null;
  if (!dt || isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
