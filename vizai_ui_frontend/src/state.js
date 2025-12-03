import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Global filter and app state shared across Dashboard, Timeline, and Reports.
 * Persists presets and onboarding status in localStorage (mock only).
 */
const FilterContext = createContext(null);

// PUBLIC_INTERFACE
export const useFilters = () => useContext(FilterContext);

/**
 * PUBLIC_INTERFACE
 * FilterProvider implements unified state and helpers:
 * - filters: { dateRange, behavior, species, minConfidence, hours }
 * - applyFilters, resetFilters, savePreset, loadPreset, deletePreset
 * - quick ranges: today, last7, last30
 * - presets persisted to localStorage under 'vizai.presets'
 * - onboarding persisted under 'vizai.onboarding'
 */
export function FilterProvider({ children }) {
  const defaultFilters = {
    dateRange: "Last 7 Days",
    behavior: "All",
    species: "Giant Anteater",
    minConfidence: 0,
    hours: 24,
    // timeline selection mock
    selection: null,
  };

  const [filters, setFilters] = useState(() => {
    try {
      const raw = localStorage.getItem("vizai.filters");
      if (raw) return { ...defaultFilters, ...JSON.parse(raw) };
    } catch {}
    return defaultFilters;
  });

  const [presets, setPresets] = useState(() => {
    try {
      const raw = localStorage.getItem("vizai.presets");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [onboarding, setOnboarding] = useState(() => {
    try {
      const raw = localStorage.getItem("vizai.onboarding");
      return raw
        ? JSON.parse(raw)
        : { completed: false, roleChosen: false, defaultSpecies: "Giant Anteater", defaultRange: "Last 7 Days" };
    } catch {
      return { completed: false, roleChosen: false, defaultSpecies: "Giant Anteater", defaultRange: "Last 7 Days" };
    }
  });

  const applyFilters = (patch) => {
    setFilters((f) => {
      const next = { ...f, ...patch };
      try {
        localStorage.setItem("vizai.filters", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetFilters = () => {
    applyFilters(defaultFilters);
  };

  const savePreset = (name) => {
    if (!name) return;
    const entry = { id: Date.now(), name, data: filters };
    setPresets((p) => {
      const next = [entry, ...p].slice(0, 20);
      try {
        localStorage.setItem("vizai.presets", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const loadPreset = (id) => {
    const p = presets.find((x) => x.id === id);
    if (p) {
      applyFilters(p.data);
    }
  };

  const deletePreset = (id) => {
    setPresets((p) => {
      const next = p.filter((x) => x.id !== id);
      try {
        localStorage.setItem("vizai.presets", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const quick = {
    today: () => applyFilters({ dateRange: "Today" }),
    last7: () => applyFilters({ dateRange: "Last 7 Days" }),
    last30: () => applyFilters({ dateRange: "Last 30 Days" }),
  };

  const setOnboardingState = (patch) => {
    setOnboarding((o) => {
      const next = { ...o, ...patch };
      try {
        localStorage.setItem("vizai.onboarding", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const value = useMemo(
    () => ({
      filters,
      presets,
      onboarding,
      applyFilters,
      resetFilters,
      savePreset,
      loadPreset,
      deletePreset,
      quick,
      setOnboardingState,
    }),
    [filters, presets, onboarding]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}
