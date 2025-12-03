import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * HelpCenter page with FAQs/video placeholders, feedback form with screenshot attach (mock),
 * and system status indicator (mock uptime).
 */
export function HelpCenter() {
  const [queue, setQueue] = useState(() => {
    try {
      const raw = localStorage.getItem("vizai.feedback");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const entry = {
      id: Date.now(),
      message: text.trim(),
      file: fileName || null,
      page: window.location.pathname,
      ts: new Date().toISOString(),
      status: "queued",
    };
    const next = [entry, ...queue];
    setQueue(next);
    try {
      localStorage.setItem("vizai.feedback", JSON.stringify(next));
    } catch {}
    setText("");
    setFileName("");
    alert("Thanks! Your feedback was added to the queue (mock).");
  };

  const uptime = "99.98%";
  const lastIncident = "No incidents reported.";

  return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>Help Center</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>FAQs</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#D1D5DB", lineHeight: 1.8 }}>
          <li>How do I navigate between Dashboard, Timeline, and Reports?</li>
          <li>How do I export reports to PDF or Excel?</li>
          <li>How do I set up alerts?</li>
        </ul>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Tutorial Videos (placeholder)</div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 12, borderRadius: 12, textAlign: "center", color: "var(--muted)" }}>
              Video {i + 1} – Coming soon
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 12, borderRadius: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>System Status</div>
        <div>Uptime: <strong>{uptime}</strong></div>
        <div className="muted" style={{ fontSize: 12 }}>{lastIncident}</div>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 12, borderRadius: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Send Feedback</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Share your idea or report an issue…"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: 12,
            padding: 10,
          }}
        />
        <label style={{ color: "var(--muted)", fontSize: 12 }}>
          Attach screenshot (mock):
          <input
            type="file"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            style={{ display: "block", marginTop: 6 }}
          />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            style={{
              background: "var(--gradient)",
              color: "var(--surface)",
              border: "none",
              borderRadius: 12,
              padding: "8px 12px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          Your feedback is stored locally in a mock queue with timestamp and page context.
        </div>
      </form>

      <div>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Feedback Queue (mock)</div>
        {queue.length === 0 ? (
          <div style={{ border: `1px dashed var(--border)`, borderRadius: 12, padding: 12, textAlign: "center", color: "var(--muted)" }}>
            No feedback yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {queue.map((q) => (
              <div key={q.id} style={{ border: `1px solid var(--border)`, borderRadius: 12, padding: 10, display: "grid", gap: 4 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <div style={{ fontWeight: 800 }}>{q.page}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{q.ts}</div>
                </div>
                <div>{q.message}</div>
                <div className="muted" style={{ fontSize: 12 }}>{q.file ? `Attachment: ${q.file}` : "No attachment"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
