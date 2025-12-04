import React, { createContext, useContext, useMemo, useState } from 'react';

// PUBLIC_INTERFACE
export const FiltersContext = createContext(null);

// PUBLIC_INTERFACE
export function useFilters() {
  /** Hook to read/write shared filters state across authed pages. */
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
 * Actions:
 *  - setBehaviorType(v)
 *  - setDateRange({start,end})
 *  - setHoursRange({min,max})
 *  - setSelectedDate(d)
 *  - apply() : increments an applyVersion to signal downstream refresh
 *  - clear() : reset to defaults
 */
export function FiltersProvider({ children, initial = {} }) {
  const [behaviorType, setBehaviorType] = useState(initial.behaviorType ?? 'All');
  const [dateRange, setDateRange] = useState(initial.dateRange ?? { start: null, end: null });
  const [hoursRange, setHoursRange] = useState(initial.hoursRange ?? { min: null, max: null });
  const [selectedDate, setSelectedDate] = useState(initial.selectedDate ?? null);
  const [applyVersion, setApplyVersion] = useState(0);

  const clear = () => {
    setBehaviorType('All');
    setDateRange({ start: null, end: null });
    setHoursRange({ min: null, max: null });
    setSelectedDate(null);
    setApplyVersion(v => v + 1); // also notify listeners to recompute with cleared state
  };

  const apply = () => {
    // trigger recompute on listeners
    setApplyVersion(v => v + 1);
  };

  const value = useMemo(() => ({
    behaviorType, setBehaviorType,
    dateRange, setDateRange,
    hoursRange, setHoursRange,
    selectedDate, setSelectedDate,
    apply, clear,
    applyVersion,
  }), [behaviorType, dateRange, hoursRange, selectedDate, applyVersion]);

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}
