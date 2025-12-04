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

const cardStyle = {
  background: 'var(--surface)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  boxShadow: COLORS.shadow,
  padding: 16,
};

const inputBase = {
  width: '100%',
  background: 'var(--surface)',
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  padding: '10px 12px',
  borderRadius: 12,
  marginTop: 6,
  boxShadow: COLORS.shadow,
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #1e8a5b 0%, #34d399 100%)',
  color: '#FFFFFF',
  fontWeight: 800,
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  cursor: 'pointer',
  boxShadow: COLORS.shadow,
};

const btnSecondary = {
  background: 'transparent',
  color: COLORS.text,
  fontWeight: 800,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: '8px 12px',
  cursor: 'pointer',
};

const labelStyle = { fontSize: 12, color: 'var(--muted)', fontWeight: 700 };

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
    apply, clear,
  } = useFilters();

  // local working copy so user can adjust and then Apply
  const [localBehavior, setLocalBehavior] = useState(behaviorType);
  const [localStart, setLocalStart] = useState(dateRange?.start ? toInputDate(dateRange.start) : '');
  const [localEnd, setLocalEnd] = useState(dateRange?.end ? toInputDate(dateRange.end) : '');
  const [localMinH, setLocalMinH] = useState(hoursRange?.min ?? '');
  const [localMaxH, setLocalMaxH] = useState(hoursRange?.max ?? '');
  const [localSelectedDate, setLocalSelectedDate] = useState(selectedDate ? toInputDate(selectedDate) : '');

  // keep local in sync when external changes occur (e.g., pre-filters)
  useEffect(() => {
    setLocalBehavior(behaviorType);
  }, [behaviorType]);
  useEffect(() => {
    setLocalStart(dateRange?.start ? toInputDate(dateRange.start) : '');
    setLocalEnd(dateRange?.end ? toInputDate(dateRange.end) : '');
  }, [dateRange?.start, dateRange?.end]);
  useEffect(() => {
    setLocalMinH(hoursRange?.min ?? '');
    setLocalMaxH(hoursRange?.max ?? '');
  }, [hoursRange?.min, hoursRange?.max]);
  useEffect(() => {
    setLocalSelectedDate(selectedDate ? toInputDate(selectedDate) : '');
  }, [selectedDate]);

  const onApply = () => {
    setBehaviorType(localBehavior);
    setDateRange({
      start: localStart ? new Date(localStart) : null,
      end: localEnd ? new Date(localEnd) : null,
    });
    setHoursRange({
      min: localMinH === '' ? null : Number(localMinH),
      max: localMaxH === '' ? null : Number(localMaxH),
    });
    // keep selectedDate coherent with dateRange if single-day selection overlaps
    if (localSelectedDate) {
      const d = new Date(localSelectedDate);
      setSelectedDate(d);
      if (!localStart || !localEnd) {
        // If the range is unset, align it to the selected day
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        setDateRange({ start, end });
      }
    } else {
      setSelectedDate(null);
    }
    apply();
  };

  const onClear = () => {
    clear();
  };

  const behaviorOptions = useMemo(() => availableBehaviors, [availableBehaviors]);

  return (
    <aside style={{ display: 'grid', gap: 12, minWidth: 260 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, marginBottom: 10, color: COLORS.text }}>Filters</div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
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
                style={{ ...inputBase, height: 92 }}
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

          <div>
            <label style={labelStyle}>Date Range</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="date"
                aria-label="Start date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                style={inputBase}
              />
              <input
                type="date"
                aria-label="End date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                style={inputBase}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Hours Range (min/max)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="number"
                placeholder="Min"
                aria-label="Min hours"
                value={localMinH === null ? '' : localMinH}
                onChange={(e) => setLocalMinH(e.target.value)}
                style={inputBase}
                min={0}
                max={24}
              />
              <input
                type="number"
                placeholder="Max"
                aria-label="Max hours"
                value={localMaxH === null ? '' : localMaxH}
                onChange={(e) => setLocalMaxH(e.target.value)}
                style={inputBase}
                min={0}
                max={24}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Quick Date</label>
            <input
              type="date"
              aria-label="Quick calendar date"
              value={localSelectedDate}
              onChange={(e) => {
                const v = e.target.value;
                setLocalSelectedDate(v);
                if (v) {
                  // also keep start/end aligned to that date if currently empty
                  if (!localStart || !localEnd) {
                    setLocalStart(v);
                    setLocalEnd(v);
                  }
                }
              }}
              style={inputBase}
            />
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Quick select a single date; range fields auto-sync if empty.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button onClick={onApply} style={btnPrimary} title="Apply Filters">Apply Filters</button>
            <button onClick={onClear} style={btnSecondary} title="Clear Filters">Clear Filters</button>
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
