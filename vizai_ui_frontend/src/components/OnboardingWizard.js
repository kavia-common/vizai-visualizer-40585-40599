import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useFilters } from "../state";

/**
 * PUBLIC_INTERFACE
 * OnboardingWizard: 3-step wizard (role selection, default species, default date range)
 * Persists to localStorage via FilterProvider onboarding state. Shows once after login unless reset.
 */
export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { role, setRole } = useAuth();
  const { onboarding, setOnboardingState, applyFilters } = useFilters();

  const [step, setStep] = useState(1);
  const [tmpRole, setTmpRole] = useState(role || "researcher");
  const [species, setSpecies] = useState(onboarding.defaultSpecies || "Giant Anteater");
  const [range, setRange] = useState(onboarding.defaultRange || "Last 7 Days");

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = () => {
    // Persist role and defaults, update global filters
    setRole(tmpRole);
    setOnboardingState({
      completed: true,
      roleChosen: true,
      defaultSpecies: species,
      defaultRange: range,
    });
    applyFilters({ species, dateRange: range });
    navigate("/dashboard", { replace: true });
  };

  const StepIndicator = () => (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          aria-label={`Step ${i}`}
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: step === i ? "var(--primary)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding Wizard"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 80,
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{ width: 560, maxWidth: "100%", padding: 16, borderRadius: 16, display: "grid", gap: 12 }}
      >
        <div style={{ fontWeight: 900, fontSize: 18, textAlign: "center" }}>Welcome to VizAI</div>
        <StepIndicator />

        {step === 1 && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Select your role</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>
              Your role personalizes the default dashboard and menu visibility.
            </div>
            <select
              aria-label="Role"
              value={tmpRole}
              onChange={(e) => setTmpRole(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "var(--text)",
              }}
            >
              <option value="keeper">Animal Keeper</option>
              <option value="researcher">Researcher</option>
              <option value="veterinarian">Veterinarian</option>
            </select>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span />
              <button
                onClick={next}
                style={{
                  background: "var(--gradient)",
                  color: "var(--surface)",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Choose default species</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>You can change this later from the sidebar.</div>
            <select
              aria-label="Default Species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "var(--text)",
              }}
            >
              <option value="Giant Anteater">Giant Anteater</option>
              <option value="Pangolin" disabled>
                Pangolin (Coming Soon)
              </option>
              <option value="Sloth" disabled>
                Sloth (Coming Soon)
              </option>
            </select>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <button
                onClick={back}
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "8px 12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={next}
                style={{
                  background: "var(--gradient)",
                  color: "var(--surface)",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Pick your default date range</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>
              Quick filters like Today, Last 7 days, Last 30 days are available.
            </div>
            <select
              aria-label="Default Range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "var(--text)",
              }}
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom…</option>
            </select>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <button
                onClick={back}
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "8px 12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={finish}
                style={{
                  background: "var(--gradient)",
                  color: "var(--surface)",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
