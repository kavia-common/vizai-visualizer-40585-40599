import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFilters } from "../state";

/**
 * PUBLIC_INTERFACE
 * AlertsCenter: Threshold alert definitions, badge counts, and actions (Snooze, Resolve, View Details).
 * Delivery options are mocked (Email/In-app/Slack). Clicking alert opens Timeline with applied filters.
 */
export default function AlertsCenter() {
  const navigate = useNavigate();
  const { applyFilters } = useFilters();

  const [alerts, setAlerts] = useState(() => {
    try {
      const raw = localStorage.getItem("vizai.alerts");
      return raw
        ? JSON.parse(raw)
        : [
            {
              id: 1,
              title: "Moving > 8h/day",
              behavior: "Moving",
              status: "unread",
              delivery: ["In-app"],
              createdAt: Date.now() - 1000 * 60 * 60 * 2,
            },
            {
              id: 2,
              title: "Idle spike detected",
              behavior: "Recumbent",
              status: "unread",
              delivery: ["Email", "Slack"],
              createdAt: Date.now() - 1000 * 60 * 60 * 6,
            },
          ];
    } catch {
      return [];
    }
  });

  const unread = useMemo(() => alerts.filter((a) => a.status === "unread").length, [alerts]);

  const persist = (next) => {
    setAlerts(next);
    try {
      localStorage.setItem("vizai.alerts", JSON.stringify(next));
    } catch {}
  };

  const markResolved = (id) => {
    persist(alerts.map((a) => (a.id === id ? { ...a, status: "resolved" } : a)));
  };

  const snooze = (id) => {
    // mock: just mark read
    persist(alerts.map((a) => (a.id === id ? { ...a, status: "snoozed" } : a)));
  };

  const viewDetails = (a) => {
    applyFilters({ behavior: a.behavior });
    navigate("/timeline", { state: { behaviorFilter: a.behavior } });
  };

  const createAlert = () => {
    const title = window.prompt("Alert name (e.g., Moving > 8h/day)");
    const behavior = window.prompt("Behavior (Recumbent, Non-Recumbent, Scratching, Self-Directed, Pacing, Moving)", "Moving");
    if (!title || !behavior) return;
    const entry = {
      id: Date.now(),
      title,
      behavior,
      status: "unread",
      delivery: ["In-app"],
      createdAt: Date.now(),
    };
    persist([entry, ...alerts]);
  };

  const editAlert = (a) => {
    const title = window.prompt("Edit alert name", a.title);
    if (!title) return;
    const delivery = window.prompt("Delivery (comma separated: Email,In-app,Slack)", a.delivery.join(","));
    const list = delivery
      ? delivery
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : a.delivery;
    persist(alerts.map((x) => (x.id === a.id ? { ...x, title, delivery: list } : x)));
  };

  const disableAlert = (id) => {
    if (!window.confirm("Disable this alert?")) return;
    persist(alerts.filter((a) => a.id !== id));
  };

  const timeAgo = (ts) => {
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
    };

  return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900 }}>Alert Center</div>
        <div className="badge" aria-label={`Unread: ${unread}`}>● {unread} unread</div>
        <span style={{ marginLeft: "auto" }} />
        <button
          style={{ background: "var(--gradient)", color: "var(--surface)", border: "none", borderRadius: 12, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}
          onClick={createAlert}
        >
          New Alert
        </button>
      </div>

      {alerts.length === 0 ? (
        <div style={{ border: `1px dashed var(--border)`, borderRadius: 12, padding: 16, textAlign: "center", color: "var(--muted)" }}>
          No alerts yet. Create one to be notified about thresholds.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {alerts.map((a) => (
            <div
              key={a.id}
              style={{
                border: `1px solid var(--border)`,
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 6,
                background: a.status === "unread" ? "rgba(245,158,11,0.06)" : "var(--surface)",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  aria-hidden
                  style={{ width: 10, height: 10, borderRadius: 999, background: a.status === "resolved" ? "#10B981" : "#F59E0B" }}
                />
                <div style={{ fontWeight: 800 }}>{a.title}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Behavior: {a.behavior}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginLeft: "auto" }}>{timeAgo(a.createdAt)}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  Delivery: {a.delivery.join(" / ")}
                </div>
                <span style={{ flex: 1 }} />
                <button
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
                  onClick={() => viewDetails(a)}
                  title="Open Timeline with filters applied"
                >
                  View Details
                </button>
                <button
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
                  onClick={() => snooze(a.id)}
                >
                  Snooze
                </button>
                <button
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
                  onClick={() => markResolved(a.id)}
                >
                  Resolve
                </button>
                <button
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
                  onClick={() => editAlert(a)}
                >
                  Edit
                </button>
                <button
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 800 }}
                  onClick={() => disableAlert(a.id)}
                >
                  Disable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ color: "var(--muted)", fontSize: 12 }}>
        Scheduling and delivery are mocked. Email/Slack require backend integration in future phases.
      </div>
    </div>
  );
}
