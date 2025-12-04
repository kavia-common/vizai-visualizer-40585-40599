import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

// PUBLIC_INTERFACE
export const FiltersContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * useFilters hook that throws if provider is missing. Prefer useFiltersSafe where a graceful fallback is needed.
 */
export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error(
      'useFilters must be used within a <FiltersProvider>. Ensure authenticated routes (Dashboard, Timeline, Reports) are wrapped by <FiltersProvider> (e.g., in AuthedLayout).'
    );
  }
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * Safe variant that returns null instead of throwing when provider is missing.
 * Useful for defensive UI fallbacks without violating hooks rules.
 */
export function useFiltersSafe() {
  return useContext(FiltersContext);
}

/**
 * PUBLIC_INTERFACE
 * FiltersProvider centralizes filter state for Dashboard, Timeline, and Reports.
 * State:
 *  - behaviorType: string|string[] (default 'All')
 *  - dateRange: { start: string|Date|null, end: string|Date|null }
 *  - hoursRange: { min: number|null, max: number|null }
 *  - selectedDate: string|Date|null
 *  - period: 'daily'|'weekly'|'monthly'|'custom'
 * Actions:
 *  - setBehaviorType(v)
 *  - setDateRange({start,end})
 *  - setHoursRange({min,max})
 *  - setSelectedDate(d)
 *  - setPeriod(p) : also updates dateRange for presets
 *  - apply() : increments an applyVersion to signal downstream refresh
 *  - clear() : reset to defaults
 *
 * Persistence:
 *  - Persists to localStorage and hydrates on mount.
 */
const STORAGE_KEY = 'vizai_filters_v1';

function reviveDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function safeRead() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // Coerce date fields back to Date
    if (parsed.dateRange) {
      parsed.dateRange = {
        start: reviveDate(parsed.dateRange.start),
        end: reviveDate(parsed.dateRange.end),
      };
    }
    if (parsed.selectedDate) parsed.selectedDate = reviveDate(parsed.selectedDate);
    return parsed;
  } catch {
    return null;
  }
}

function safeWrite(val) {
  try {
    const serializable = {
      ...val,
      dateRange: val.dateRange
        ? {
            start: val.dateRange.start ? new Date(val.dateRange.start).toISOString() : null,
            end: val.dateRange.end ? new Date(val.dateRange.end).toISOString() : null,
          }
        : { start: null, end: null },
      selectedDate: val.selectedDate ? new Date(val.selectedDate).toISOString() : null,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // ignore storage failures
  }
}

// PUBLIC_INTERFACE
export function FiltersProvider({ children, initial = {} }) {
  // Hydrate initial state from localStorage once
  const persisted = typeof window !== 'undefined' ? safeRead() : null;

  const [behaviorType, setBehaviorType] = useState(persisted?.behaviorType ?? initial.behaviorType ?? 'All');
  const [dateRange, setDateRange] = useState(persisted?.dateRange ?? initial.dateRange ?? { start: null, end: null });
  const [hoursRange, setHoursRange] = useState(persisted?.hoursRange ?? initial.hoursRange ?? { min: null, max: null });
  const [selectedDate, setSelectedDate] = useState(persisted?.selectedDate ?? initial.selectedDate ?? null);
  const [period, _setPeriod] = useState(persisted?.period ?? initial.period ?? 'weekly'); // daily|weekly|monthly|custom
  const [applyVersion, setApplyVersion] = useState(0);

  function computePresetRange(p) {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    if (p === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (p === 'weekly') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (p === 'monthly') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else {
      return { start: dateRange.start, end: dateRange.end };
    }
    return { start, end };
  }

  const clear = () => {
    setBehaviorType('All');
    setDateRange({ start: null, end: null });
    setHoursRange({ min: null, max: null });
    setSelectedDate(null);
    _setPeriod('weekly');
    setApplyVersion(v => v + 1);
  };

  const apply = () => {
    setApplyVersion(v => v + 1);
  };

  const setPeriodAndRange = useCallback((p) => {
    _setPeriod(p);
    if (p !== 'custom') {
      setDateRange(computePresetRange(p));
    }
    setApplyVersion(v => v + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* computePresetRange uses dateRange, but it's recomputed at call time */]);

  // Persist on changes
  useEffect(() => {
    const snapshot = { behaviorType, dateRange, hoursRange, selectedDate, period };
    safeWrite(snapshot);
  }, [behaviorType, dateRange, hoursRange, selectedDate, period]);

  const value = useMemo(() => ({
    behaviorType, setBehaviorType,
    dateRange, setDateRange,
    hoursRange, setHoursRange,
    selectedDate, setSelectedDate,
    period, setPeriod: setPeriodAndRange,
    apply, clear,
    applyVersion,
  }), [behaviorType, dateRange, hoursRange, selectedDate, period, applyVersion, setPeriodAndRange]);

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}
