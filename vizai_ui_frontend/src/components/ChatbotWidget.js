import React, { useEffect, useRef, useState } from 'react';

// PUBLIC_INTERFACE
export default function ChatbotWidget() {
  /** A compact floating chatbot widget with toggle button and mock AI replies.
   * - Fixed at bottom-right on authenticated pages.
   * - Accessible aria-labels, keyboard navigation, and focus handling.
   * - Neon Fun styling (#10B981 primary, #374151 text, white surface).
   * - Responsive: near-full width on narrow viewports.
   */
  const PRIMARY = '#10B981';
  const TEXT = '#374151';
  const SURFACE = '#FFFFFF';
  const BORDER = 'var(--border, #E5E7EB)';
  const SHADOW = 'var(--shadow, 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1))';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I’m VizAI Assistant. How can I help with your analysis today?' },
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll to bottom when new messages added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Mock AI response after a short delay
    setTimeout(() => {
      const reply = mockReply(trimmed);
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    }, 450);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const containerStyle = {
    position: 'fixed',
    right: 16,
    bottom: 16,
    zIndex: 100,
  };

  // Responsive panel: 320–360px width on desktop, near-full width on very small screens
  const panelStyle = {
    width: 'min(360px, 92vw)',
    height: 'min(480px, 78vh)',
    background: SURFACE,
    color: TEXT,
    border: `1px solid ${BORDER}`,
    boxShadow: SHADOW,
    borderRadius: 16,
    overflow: 'hidden',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderBottom: `1px solid ${BORDER}`,
    background: 'var(--table-header-bg, #F9FAFB)',
  };

  const messagesStyle = {
    padding: 12,
    overflowY: 'auto',
    background: 'rgba(55,65,81,0.03)',
  };

  const inputBarStyle = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: 12,
    borderTop: `1px solid ${BORDER}`,
    background: SURFACE,
  };

  const textAreaStyle = {
    flex: 1,
    resize: 'none',
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    padding: '10px 12px',
    minHeight: 40,
    maxHeight: 96,
    fontSize: 14,
    color: TEXT,
    boxShadow: SHADOW,
  };

  const sendBtnStyle = {
    background: 'linear-gradient(135deg, #1e8a5b 0%, #34d399 100%)',
    color: '#FFFFFF',
    fontWeight: 800,
    border: 'none',
    borderRadius: 12,
    padding: '10px 12px',
    cursor: 'pointer',
    boxShadow: SHADOW,
    flex: '0 0 auto',
  };

  const toggleBtnStyle = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e8a5b 0%, #34d399 100%)',
    color: '#FFFFFF',
    border: 'none',
    boxShadow: SHADOW,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontSize: 22,
  };

  const closeBtnStyle = {
    background: 'transparent',
    color: TEXT,
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: '6px 8px',
    cursor: 'pointer',
    fontWeight: 800,
  };

  return (
    <div style={containerStyle} aria-live="polite">
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="VizAI Assistant"
          style={panelStyle}
        >
          <div style={headerStyle}>
            <div
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                background: 'rgba(16,185,129,0.12)',
                color: PRIMARY,
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${BORDER}`,
                fontWeight: 900,
              }}
              title="Assistant"
            >
              ✨
            </div>
            <div style={{ fontWeight: 900, color: TEXT }}>VizAI Assistant</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                style={closeBtnStyle}
                onClick={() => setOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                Close
              </button>
            </div>
          </div>

          <div ref={listRef} style={messagesStyle}>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gap: 8,
              }}
            >
              {messages.map((m, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      background:
                        m.role === 'user'
                          ? 'linear-gradient(135deg, #1e8a5b 0%, #34d399 100%)'
                          : SURFACE,
                      color: m.role === 'user' ? '#FFFFFF' : TEXT,
                      border: `1px solid ${m.role === 'user' ? 'transparent' : BORDER}`,
                      borderRadius: 12,
                      padding: '8px 10px',
                      boxShadow: SHADOW,
                      whiteSpace: 'pre-wrap',
                    }}
                    aria-label={`${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`}
                  >
                    {m.content}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div style={inputBarStyle}>
            <label htmlFor="vizai-chat-input" className="sr-only">Type your message</label>
            <textarea
              id="vizai-chat-input"
              ref={inputRef}
              rows={1}
              placeholder="Ask about behaviors, timelines, or reports…"
              aria-label="Chat input"
              style={textAreaStyle}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={sendMessage}
              style={sendBtnStyle}
              title="Send message"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        style={toggleBtnStyle}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Hide chat' : 'Open chat'}
        aria-label={open ? 'Hide chat' : 'Open chat'}
        aria-expanded={open}
      >
        {open ? '✖' : '💬'}
      </button>
    </div>
  );
}

function mockReply(userText) {
  // Simple playful mock responses based on keywords
  const t = userText.toLowerCase();
  if (t.includes('moving') || t.includes('behavior')) {
    return 'Looks like “Moving” has notable presence. You can click the pie legend in Dashboard to jump into a filtered Timeline!';
  }
  if (t.includes('report')) {
    return 'Reports are mocked for now. Try “Download PDF (mock)” on the Reports page to see the flow.';
  }
  if (t.includes('timeline')) {
    return 'Open Timeline to explore segments. Use the left Filters to narrow by behavior and time.';
  }
  return 'Great question! I’m a mock assistant today — try asking about “timeline”, “report”, or “behavior”.';
}
