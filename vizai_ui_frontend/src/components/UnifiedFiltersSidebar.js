import React, { useState } from "react";
import { useFilters } from "../state";

/**
 * PUBLIC_INTERFACE
 * UnifiedFiltersSidebar: shared left sidebar with:
 * - Apply, Reset, Save Preset, Quick Filters (Today/Last 7/Last 30)
 * - Preset CRUD (load/delete)
 * - Updates global unified filter state across views
 */
export default function UnifiedFiltersSidebar() {
  const {
    filters,
    presets,
    applyFilters,
    resetFilters,
    savePreset,
    loadPreset,
    deletePreset,
    quick,
  } = useFilters();

  const [draft, setDraft] = useState(filters);
  const [newPreset, setNewPreset] = useState("");

  const BEHAVIOR_CATEGORIES = [
    "All",
    "Recumbent",
    "Non-Recumbent",
    "Scratching",
    "Self-Directed",
    "Pacing",
    "Moving",
  ];

  const onApply = () => {
    applyFilters(draft);
  };

  const onReset = () => {
    resetFilters();
    setDraft((d) => ({ ...d, dateRange: "Last 7 Days", behavior: "All", minConfidence: 0, species: "Giant Anteater" }));
  };

  const onSavePreset = () => {
    if (!newPreset.trim()) return;
    savePreset(newPreset.trim());
    setNewPreset("");
  };

  return (
    <aside className="card" style={{ width: 260, padding: 16, borderRadius: 16, height: "fit-content", position: "sticky", top: 88 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Filters</div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>Species</label>
          <select
            aria-label="Species"
            value={draft.species}
            onChange={(e) => setDraft({ ...draft, species: e.target.value })}
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "8px 10px",
              borderRadius: 12,
              marginTop: 6,
              boxShadow: "var(--shadow)",
            }}
          >
            <option>Giant Anteater</option>
            <option disabled>Pangolin (Coming Soon)</option>
            <option disabled>Sloth (Coming Soon)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>Date Range</label>
          <select
            aria-label="Date Range"
            value={draft.dateRange}
            onChange={(e) => setDraft({ ...draft, dateRange: e.target.value })}
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "8px 10px",
              borderRadius: 12,
              marginTop: 6,
              boxShadow: "var(--shadow)",
            }}
          >
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom…</option>
          </select>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <button
              onClick={quick.today}
              style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
              title="Today"
            >
              Today
            </button>
            <button
              onClick={quick.last7}
              style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
              title="Last 7 Days"
            >
              Last 7
            </button>
            <button
              onClick={quick.last30}
              style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
              title="Last 30 Days"
            >
              Last 30
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>Behavior</label>
          <select
            aria-label="Behavior"
            value={draft.behavior}
            onChange={(e) => setDraft({ ...draft, behavior: e.target.value })}
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "8px 10px",
              borderRadius: 12,
              marginTop: 6,
              boxShadow: "var(--shadow)",
            }}
          >
            {BEHAVIOR_CATEGORIES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>Min Confidence</label>
          <input
            type="range"
            min={0}
            max={100}
            value={draft.minConfidence}
            onChange={(e) => setDraft({ ...draft, minConfidence: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
          <div className="muted" style={{ fontSize: 12 }}>≥ {draft.minConfidence}%</div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onReset}
            aria-label="Reset filters"
            style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontWeight: 800 }}
          >
            Reset
          </button>
          <button
            onClick={onApply}
            aria-label="Apply filters"
            style={{ background: "var(--gradient)", color: "var(--surface)", border: "none", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontWeight: 800 }}
          >
            Apply
          </button>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Presets</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={newPreset}
              onChange={(e) => setNewPreset(e.target.value)}
              placeholder="Preset name"
              aria-label="Preset name"
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: 12,
                padding: "8px 10px",
              }}
            />
            <button
              onClick={onSavePreset}
              style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontWeight: 800 }}
            >
              Save
            </button>
          </div>
          {presets.length === 0 ? (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>No presets yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
              {presets.map((p) => (
                <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={() => loadPreset(p.id)}
                    style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
                    title="Load preset"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => deletePreset(p.id)}
                    aria-label={`Delete preset ${p.name}`}
                    style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "4px 8px", cursor: "pointer", fontWeight: 800 }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
