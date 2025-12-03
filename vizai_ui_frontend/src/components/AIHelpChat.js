import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * AIHelpChat - persistent floating chatbot for contextual help and navigation tips.
 * - Bottom-right launcher button toggles an accessible chat dialog.
 * - ESC closes the chat, focus is managed back to the launcher.
 * - Mocked intents/responses with route-aware quick suggestion chips.
 * - Uses theme variables via CSS for colors and shadows.
 */
export default function AIHelpChat() {
  const location = useLocation();
  const navigate = useNavigate();

  // open state persisted in-memory only
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I’m your VizAI helper. How can I assist you today?" },
    { role: "assistant", text: "Tip: Ask VizAI, e.g., “Why is moving high today?” You can run or apply to the current view." },
  ]);
  const [input, setInput] = useState("");

  // Refs for focus management
  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Route-aware page context
  const pageKey = useMemo(() => {
    const path = location.pathname || "/";
    if (path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/timeline")) return "timeline";
    if (path.startsWith("/reports")) return "reports";
    if (path.startsWith("/alerts")) return "alerts";
    if (path.startsWith("/select-animal")) return "select";
    if (path.startsWith("/login")) return "login";
    if (path.startsWith("/register")) return "register";
    return "other";
  }, [location.pathname]);

  // Quick suggestions (chips) per page context
  const quickChips = useMemo(() => {
    const base = [
      "What can I do on this page?",
      "How do I navigate VizAI?",
      "Where can I find my alerts?",
    ];
    const map = {
      login: ["How do I sign in?", "I forgot my password", "Create an account"],
      register: ["Which role should I pick?", "How do I register?"],
      select: ["What is Giant Anteater data?", "Go to Dashboard", "Change species"],
      dashboard: [
        "Explain Behavior Duration",
        "Show me behavior anomalies",
        "Where is the Timeline view?",
      ],
      timeline: [
        "Explain timeline details",
        "How to preview video?",
        "Filter behaviors by type",
      ],
      reports: [
        "How do I generate a report?",
        "What is Behavior Duration Analysis?",
        "Export to PDF/Excel",
      ],
      alerts: ["Explain alert types", "How to resolve an alert?"],
      other: base,
    };
    return map[pageKey] || base;
  }, [pageKey]);

  // Mocked intent recognition and responses
  const getMockResponse = (q) => {
    const text = (q || "").toLowerCase();

    // navigation helpers
    if (text.includes("go to dashboard") || text.includes("dashboard")) {
      return {
        text: "Opening Dashboard. You can view Behavior Count, Duration, and Daily Activity patterns there.",
        action: () => navigate("/dashboard"),
      };
    }
    if (text.includes("timeline")) {
      return {
        text: "Opening Timeline. Here you can explore events, preview video segments, and filter behaviors.",
        action: () => navigate("/timeline"),
      };
    }
    if (text.includes("report") || text.includes("generate a report")) {
      return {
        text:
          "Go to Reports to generate summaries like Behavior Duration Analysis. Choose Type, Behavior, Date Range, and export as PDF or Excel.",
        action: () => navigate("/reports"),
      };
    }
    if (text.includes("alerts") || text.includes("alert")) {
      return {
        text: "Opening Alerts. You can review notifications and follow up actions from here.",
        action: () => navigate("/alerts"),
      };
    }

    // contextual explanations
    if (text.includes("explain") && text.includes("timeline")) {
      return {
        text:
          "Timeline shows behavior events with time ranges. Use Preview to watch exact video segments and filters to refine by behavior and confidence.",
      };
    }
    if (text.includes("explain") && (text.includes("duration") || text.includes("behavior duration"))) {
      return {
        text:
          "Behavior Duration shows total time spent per behavior. Toggle between Pie and Stacked Bar to compare proportions across categories.",
      };
    }

    // login/register generic
    if (pageKey === "login" && (text.includes("sign in") || text.includes("login"))) {
      return { text: "Enter your email and password, then press Login. Need an account? Use Create an account." };
    }
    if (pageKey === "register" && (text.includes("register") || text.includes("role"))) {
      return {
        text:
          "Pick the role that matches your work: Keeper, Researcher, or Veterinarian. Roles affect navigation and suggested tips.",
      };
    }

    // Helpful defaults per page
    const defaults = {
      dashboard:
        "On Dashboard, review Behavior Count, Duration, and Daily Activity. Click a behavior to dive deeper on the Timeline.",
      timeline:
        "Use time range tabs and filters on the left. Click Preview on any event card or row to open the video modal.",
      reports:
        "Select a report type, configure parameters, and export. Behavior Duration Analysis summarizes time budgets.",
      select: "Pick a species to proceed to the Dashboard. Currently Giant Anteater is available.",
      alerts: "Review alerts here. You’ll see details and can navigate to related pages.",
      login: "Sign in with your credentials. If new, go to registration.",
      register: "Fill email, password, and choose a role. Then you can sign in.",
      other:
        "Ask me about navigation, feature explanations, or troubleshooting. For example: “How do I generate a report?”",
    };
    return { text: defaults[pageKey] || defaults.other };
  };

  const sendMessage = (q) => {
    if (!q.trim()) return;
    const userMsg = { role: "user", text: q.trim() };
    setMessages((m) => [...m, userMsg]);

    const resp = getMockResponse(q);
    const assistantMsg = { role: "assistant", text: resp.text };
    setMessages((m) => [...m, userMsg, assistantMsg]);

    // run optional navigation action after a slight delay to allow reading
    if (typeof resp.action === "function") {
      setTimeout(() => resp.action(), 250);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
    setInput("");
  };

  // Handle ESC to close and focus restore
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        setTimeout(() => {
          launcherRef.current?.focus();
        }, 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Auto focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open, pageKey]);

  // Styles via theme tokens
  const styles = {
    launcherBtn: {
      position: "fixed",
      right: 16,
      bottom: 16,
      zIndex: 70,
      background: "var(--gradient)",
      color: "var(--surface)",
      border: "none",
      borderRadius: 999,
      padding: "12px 16px",
      boxShadow: "var(--shadow)",
      fontWeight: 800,
      cursor: "pointer",
    },
    panel: {
      position: "fixed",
      right: 16,
      bottom: 84,
      width: "min(360px, calc(100vw - 32px))",
      height: "min(520px, calc(100vh - 140px))",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      boxShadow: "var(--shadow)",
      color: "var(--text)",
      display: open ? "grid" : "none",
      gridTemplateRows: "auto 1fr auto",
      zIndex: 70,
      overflow: "hidden",
    },
    header: {
      padding: 12,
      background: "var(--table-header-bg)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: "space-between",
    },
    title: { fontWeight: 900 },
    body: { padding: 12, overflow: "auto", display: "grid", gap: 8 },
    footer: { padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 },
    chip: {
      background: "transparent",
      color: "var(--text)",
      border: "1px solid var(--border)",
      borderRadius: 999,
      padding: "6px 10px",
      cursor: "pointer",
    },
    msg: (role) => ({
      padding: "8px 10px",
      borderRadius: 12,
      border: "1px solid var(--border)",
      background: role === "assistant" ? "rgba(30,138,91,0.08)" : "var(--surface)",
    }),
    input: {
      flex: 1,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      padding: "10px 12px",
      borderRadius: 12,
      boxShadow: "var(--shadow)",
    },
    buttonGhost: {
      background: "transparent",
      color: "var(--text)",
      fontWeight: 800,
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "8px 12px",
      cursor: "pointer",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 8px",
      borderRadius: 999,
      background: "rgba(30,138,91,0.10)",
      color: "var(--primary)",
      fontSize: 12,
      fontWeight: 700,
    },
  };

  const openPanel = () => setOpen(true);
  const closePanel = () => {
    setOpen(false);
    setTimeout(() => launcherRef.current?.focus(), 0);
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        ref={launcherRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="vizai-help-chat"
        style={styles.launcherBtn}
        className="focus-ring"
        onClick={open ? closePanel : openPanel}
        title={open ? "Close help" : "Open help"}
      >
        {open ? "Close Help" : "Need Help?"}
      </button>

      {/* Chat panel */}
      <section
        ref={containerRef}
        id="vizai-help-chat"
        role="dialog"
        aria-modal="false"
        aria-label="VizAI Help Chat"
        style={styles.panel}
      >
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={styles.title}>VizAI Help</span>
            <span style={styles.badge} aria-label={`Context: ${pageKey}`}>
              ● {pageKey}
            </span>
          </div>
          <button
            type="button"
            onClick={closePanel}
            style={styles.buttonGhost}
            className="focus-ring"
            aria-label="Close help"
            title="Close help"
          >
            ✕
          </button>
        </div>

        <div style={styles.body}>
          {/* Quick suggestions (contextual) */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {quickChips.map((c, idx) => (
              <button
                key={`${pageKey}-chip-${idx}`}
                type="button"
                style={styles.chip}
                className="focus-ring"
                onClick={() => sendMessage(c)}
                aria-label={`Ask: ${c}`}
                title={c}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Message list */}
          <div style={{ display: "grid", gap: 6 }}>
            {messages.map((m, i) => (
              <div key={`msg-${i}`} style={styles.msg(m.role)} aria-live="polite">
                <strong style={{ marginRight: 6 }}>{m.role === "assistant" ? "Assistant" : "You"}:</strong>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
        </div>

        <form style={styles.footer} onSubmit={onSubmit}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask VizAI: e.g., "Why is moving high today?"'
            aria-label="Your question"
            style={styles.input}
          />
          <button type="submit" style={{ background: "var(--gradient)", color: "var(--surface)", fontWeight: 800, border: "none", borderRadius: 12, padding: "10px 14px", cursor: "pointer", boxShadow: "var(--shadow)" }}>
            Send
          </button>
        </form>
      </section>
    </>
  );
}
