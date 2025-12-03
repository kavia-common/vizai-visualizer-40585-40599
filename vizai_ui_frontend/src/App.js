import React, { useEffect, useMemo, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import './index.css';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * AuthContext simulates signed-in state for route guarding
 */
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export const useAuth = () => useContext(AuthContext);

/**
 * PUBLIC_INTERFACE
 * Tokens are driven by CSS variables. This map reads from getComputedStyle for inline styles.
 */
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name) || '';
const themeTokens = {
  get primary() { return cssVar('--primary').trim() || '#1e8a5b'; },
  get secondary() { return cssVar('--secondary').trim() || '#F59E0B'; },
  get error() { return cssVar('--error').trim() || '#DC2626'; },
  get background() { return cssVar('--bg').trim() || '#F3F4F6'; },
  get surface() { return cssVar('--surface').trim() || '#FFFFFF'; },
  get text() { return cssVar('--text').trim() || '#111827'; },
  get gradient() { return cssVar('--gradient').trim() || 'linear-gradient(135deg,#1e8a5b 0%,#34d399 100%)'; },
  get border() { return cssVar('--border').trim() || '#E5E7EB'; },
  get shadow() { return cssVar('--shadow').trim() || '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)'; },
};

/**
 * PUBLIC_INTERFACE
 * Basic feature flags from env for forward compatibility.
 */
const featureFlags = (() => {
  try {
    const raw = process.env.REACT_APP_FEATURE_FLAGS || '{}';
    return JSON.parse(raw);
  } catch {
    return {};
  }
})();

// Simple styles
const primaryBtnStyle = {
  background: themeTokens.gradient,
  color: 'var(--surface)',
  fontWeight: 800,
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  cursor: 'pointer',
  boxShadow: themeTokens.shadow,
};
const primaryGhostBtnStyle = {
  background: 'transparent',
  color: themeTokens.text,
  fontWeight: 800,
  border: `1px solid ${themeTokens.border}`,
  borderRadius: 12,
  padding: '8px 12px',
  cursor: 'pointer',
};

function Logo() {
  const sizePx = 64;
  return (
    <div
      className="brand"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1,
        color: 'var(--text)',
        gap: '8px',
        marginLeft: '16px',
        padding: 0,
      }}
      aria-label="VizAI brand"
    >
      <img
        src="/assets/vizai-logo-20251203.png"
        alt="VizAI Logo"
        width={sizePx}
        height={sizePx}
        style={{
          display: 'inline-block',
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          objectFit: 'contain',
          borderRadius: 12,
        }}
        title="Go to Dashboard"
      />
      <span
        className="brand-text"
        title="VizAI"
        style={{
          letterSpacing: 0.2,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '28px',
          color: '#1e8a5b',
        }}
        aria-label="VizAI"
      >
        VizAI
      </span>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * NavBar tabs only show Dashboard, Timeline, Reports (no Alerts/Help/Chat tabs).
 */
function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authed } = useAuth();

  const isActive = (path) => location.pathname === path;
  const tabStyle = (active) => ({
    position: 'relative',
    padding: '10px 14px',
    borderRadius: 12,
    fontWeight: 700,
    color: active ? themeTokens.text : 'var(--muted)',
    background: active ? 'rgba(30,138,91,0.10)' : 'transparent',
    textDecoration: 'none',
    border: `1px solid ${active ? 'rgba(30,138,91,0.35)' : 'transparent'}`,
    boxShadow: active ? themeTokens.shadow : 'none'
  });

  const onBrandClick = () => {
    if (!authed) {
      navigate('/login');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="nav" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 16, padding: 'var(--nav-padding)', position: 'sticky', top: 0, zIndex: 10 }}>
      <button
        onClick={onBrandClick}
        title="Go to Dashboard"
        aria-label="VizAI Home"
        style={{ display: 'inline-flex', alignItems: 'center', padding: 6, borderRadius: 10, border: `1px solid transparent`, background: 'transparent', cursor: 'pointer' }}
        className="focus-ring"
      >
        <Logo />
        <span className="sr-only" aria-hidden="true">VizAI Home</span>
      </button>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
        <Link to="/dashboard" style={tabStyle(isActive('/dashboard'))} title="Dashboard">Dashboard</Link>
        <Link to="/timeline" style={tabStyle(isActive('/timeline'))} title="Timeline">Timeline</Link>
        <Link to="/reports" style={tabStyle(isActive('/reports'))} title="Reports">Reports</Link>
      </div>
    </div>
  );
}

function EmptyState({ title = 'No data to display', description = 'Try adjusting filters or date range.' }) {
  return (
    <div style={{
      border: `1px dashed ${themeTokens.border}`,
      padding: 24,
      borderRadius: 16,
      textAlign: 'center',
      color: 'var(--muted)'
    }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14 }}>{description}</div>
    </div>
  );
}

function ErrorState({ message = 'Something went wrong. Please try again.' }) {
  return (
    <div role="alert" className="alert-error">
      {message}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Registration page (mock). Stores role in auth context on success then redirects to Login.
 */
function RegistrationPage() {
  const { setRole } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '');
    const password = String(fd.get('password') || '');
    const role = String(fd.get('role') || '');
    if (!email || !password || !role) {
      setError('Please complete all fields.');
      return;
    }
    // Mock success: persist role for next login step
    setRole(role);
    setError('');
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text, display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={onSubmit} style={{
        width: 'min(100%, 520px)', background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 24, boxShadow: themeTokens.shadow
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo />
        </div>
        <div className="title" style={{ textAlign: 'center', fontWeight: 900, marginBottom: 6 }}>Create your VizAI account</div>
        <div className="subtitle" style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 20 }}>
          Your role determines navigation and permissions.
        </div>

        <label htmlFor="email-reg" style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Email</label>
        <input id="email-reg" name="email" type="email" placeholder="name@organization.com" style={inputStyle} aria-required="true" />

        <label htmlFor="password-reg" style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Password</label>
        <input id="password-reg" name="password" type="password" placeholder="Enter your password" style={inputStyle} aria-required="true" />

        <label htmlFor="role-reg" style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Select Role</label>
        <select id="role-reg" name="role" defaultValue="" aria-label="Select Role" style={{ ...inputStyle, marginTop: 6 }}>
          <option value="" disabled>Choose your role…</option>
          <option value="keeper">Animal Keeper</option>
          <option value="researcher">Researcher</option>
          <option value="veterinarian">Veterinarian</option>
          <option value="admin">Admin</option>
        </select>

        {error ? <ErrorState message={error} /> : null}
        <button type="submit" style={{ ...primaryBtnStyle, width: '100%', marginTop: 12 }}>Register</button>
        <div style={{ marginTop: 12, color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}

// PUBLIC_INTERFACE
function LoginPage() {
  const { setAuthed } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '');
    const password = String(fd.get('password') || '');
    if (!email || !password) {
      setError('Please enter a valid email and password.');
      return;
    }
    setError('');
    setAuthed(true);
    navigate('/select-animal', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text, display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={onSubmit} style={{
        width: 'min(100%, 480px)', background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 24, boxShadow: themeTokens.shadow
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo />
        </div>
        <div className="title" style={{ textAlign: 'center', fontWeight: 900, marginBottom: 6 }}>Sign in to VizAI</div>
        <div className="subtitle" style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 20 }}>
          Your role determines the dashboard view and available features.
        </div>

        <label htmlFor="email" style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Email/Username</label>
        <input id="email" name="email" type="email" placeholder="name@organization.com" style={inputStyle} aria-required="true" />

        <label htmlFor="password" style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Password</label>
        <input id="password" name="password" type="password" placeholder="Enter your password" style={inputStyle} aria-required="true" />

        {error ? <ErrorState message={error} /> : null}
        <button type="submit" style={{ ...primaryBtnStyle, width: '100%', marginTop: 12 }}>Login</button>

        <div style={{ marginTop: 12, color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
          New to VizAI? <Link to="/register">Create an account</Link>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--surface)',
  border: `1px solid ${themeTokens.border}`,
  color: themeTokens.text,
  padding: '10px 12px',
  borderRadius: 12,
  margin: '8px 0 14px',
  boxShadow: themeTokens.shadow,
};

// PUBLIC_INTERFACE
function AnimalSelectPage() {
  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Select Animal</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 }}>
          <Card title="Giant Anteater" description="Myrmecophaga tridactyla" active />
          <Card title="Pangolin" description="Coming Soon" disabled />
          <Card title="Sloth" description="Coming Soon" disabled />
        </div>
      </div>
    </AuthedLayout>
  );
}

function Card({ title, description, active, disabled }) {
  return (
    <div className="card" style={{
      borderRadius: 16,
      padding: 16,
      background: disabled ? 'var(--table-row-hover)' : 'var(--card-bg)',
      opacity: disabled ? 0.6 : 1,
      boxShadow: active ? themeTokens.shadow : 'var(--shadow)'
    }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div className="muted" style={{ marginBottom: 12 }}>{description}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to={active ? '/dashboard' : '#'} style={{
          ...primaryBtnStyle,
          textDecoration: 'none',
          pointerEvents: active ? 'auto' : 'none',
          filter: active ? 'none' : 'grayscale(1)',
        }}>
          Open
        </Link>
        <button style={primaryGhostBtnStyle} disabled={!active}>Details</button>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * DashboardPage: simple behavior cards and a button to open a placeholder video modal.
 */
function DashboardPage() {
  // mock metrics aligned with current theme/wording
  const [openVideo, setOpenVideo] = useState(false);
  const [durationView, setDurationView] = useState('Pie'); // 'Count' | 'Duration' | 'Pie'

  // mock data used across cards
  const behaviors = [
    { name: 'Recumbent', count: 22, minutes: 240, color: '#10B981' },
    { name: 'Non-Recumbent', count: 17, minutes: 160, color: '#60A5FA' },
    { name: 'Scratching', count: 15, minutes: 45, color: '#F59E0B' },
    { name: 'Self-Directed', count: 10, minutes: 30, color: '#EC4899' },
    { name: 'Pacing', count: 9, minutes: 25, color: '#8B5CF6' },
    { name: 'Moving', count: 5, minutes: 18, color: '#34D399' },
  ];
  const totals = {
    events: behaviors.reduce((a, b) => a + b.count, 0),
    minutes: behaviors.reduce((a, b) => a + b.minutes, 0),
    unique: behaviors.length,
  };

  // helpers
  const maxCount = Math.max(...behaviors.map(b => b.count));
  const barPct = (n) => Math.max(6, Math.round((n / maxCount) * 100)); // min 6% for visibility

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Summary stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <SummaryStat label="Total Events" value={totals.events} />
          <SummaryStat label="Total Minutes" value={totals.minutes} />
          <SummaryStat label="Unique Behaviors" value={totals.unique} />
          <SummaryStat label="Confidence (avg)" value="88%" />
        </div>

        {/* Primary 3-column section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          {/* Behavior Count card with updated copy */}
          <div className="card" style={{ borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Behavior Count – Quick view of occurrences for selected period.</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Identify abnormal spikes quickly.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {behaviors.map((b) => (
                <div key={b.name} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                    <span>{b.name}</span>
                    <span>{b.count}</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--table-row-hover)', border: `1px solid ${themeTokens.border}`, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${barPct(b.count)}%`, background: themeTokens.gradient, height: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior Duration Analysis card with tabs and Pie mock */}
          <div className="card" style={{ borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Behavior Duration Analysis – Time spent in each behavior.</div>

            {/* tabs */}
            <div role="tablist" aria-label="Behavior Duration Views" style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {['Count', 'Duration', 'Pie'].map(tab => {
                const active = durationView === tab;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setDurationView(tab)}
                    className={active ? 'tab active' : 'tab'}
                    style={{ border: '1px solid', borderColor: active ? 'rgba(30,138,91,0.35)' : 'transparent' }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* stacked/summary subtitle */}
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              View time spent in each behavior as a {durationView === 'Pie' ? 'Pie chart' : 'stacked bar'}.
            </div>

            {/* content area */}
            {durationView === 'Pie' ? (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Behavior Duration – Pie View</div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  {behaviors.map(b => (
                    <div key={`legend-${b.name}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: b.color, border: `1px solid ${themeTokens.border}` }} />
                      <span className="muted" style={{ fontSize: 12 }}>{b.name}</span>
                    </div>
                  ))}
                </div>
                {/* Pie mock (accessible) */}
                <div aria-label="Pie chart placeholder" role="img"
                  style={{
                    width: '100%',
                    maxWidth: 320,
                    aspectRatio: '1 / 1',
                    marginInline: 'auto',
                    borderRadius: '50%',
                    background: `conic-gradient(
                      ${behaviors.map((b, i, arr) => {
                        const total = totals.minutes || 1;
                        const angle = Math.round((b.minutes / total) * 360);
                        const start = arr.slice(0, i).reduce((s, x) => s + Math.round((x.minutes / total) * 360), 0);
                        return `${b.color} ${start}deg ${start + angle}deg`;
                      }).join(',')}
                    )`,
                    border: `1px solid ${themeTokens.border}`,
                    boxShadow: themeTokens.shadow
                  }}
                />
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {durationView === 'Count' ? 'Behavior Count – Stacked Bar' : 'Behavior Duration – Stacked Bar'}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {behaviors.map(b => {
                    const num = durationView === 'Count' ? b.count : b.minutes;
                    const denom = Math.max(...behaviors.map(x => durationView === 'Count' ? x.count : x.minutes));
                    const pct = Math.max(6, Math.round((num / denom) * 100));
                    return (
                      <div key={`stack-${b.name}`} style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                          <span>{b.name}</span>
                          <span>{num}{durationView === 'Duration' ? ' min' : ''}</span>
                        </div>
                        <div style={{ height: 10, background: 'var(--table-row-hover)', border: `1px solid ${themeTokens.border}`, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, background: b.color, height: '100%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Daily Activity Pattern stays as before */}
          <div className="card" style={{ borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Daily Activity Pattern</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Visualize activity intensity across 24 hours.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} title="mock heat"
                  style={{
                    height: 22,
                    borderRadius: 6,
                    background: `rgba(30,138,91,${0.10 + ((i % 6) * 0.12)})`,
                    border: `1px solid ${themeTokens.border}`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions row (restored) */}
        <div className="card" style={{ borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800 }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to="/timeline" className="btn" style={{ textDecoration: 'none' }}>Open Timeline</Link>
              <Link to="/reports" className="btn-outline" style={{ textDecoration: 'none' }}>Build Report</Link>
              <button className="btn-outline" onClick={() => setOpenVideo(true)}>Preview Video</button>
            </div>
          </div>
        </div>
      </div>

      {/* video modal unchanged */}
      {openVideo && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
          <div className="card" style={{ width: 'min(100%, 720px)', padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Behavior Video – Preview</div>
            <div style={{ height: 360, background: 'var(--table-row-hover)', border: `1px solid ${themeTokens.border}`, borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              [ Placeholder Player ]
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button style={primaryGhostBtnStyle} onClick={() => setOpenVideo(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AuthedLayout>
  );
}

// PUBLIC_INTERFACE
function TimelinePage() {
  // simple mock, no unified filters, no range/export additions
  const items = [
    { type: 'Resting', start: '14:12', end: '14:28', durationMin: 16, camera: 'Camera 1', confidence: 0.88 },
    { type: 'Feeding', start: '14:31', end: '14:33', durationMin: 2, camera: 'Camera 1', confidence: 0.81 },
    { type: 'Moving', start: '15:03', end: '15:12', durationMin: 9, camera: 'Camera 1', confidence: 0.92 },
  ];
  return (
    <AuthedLayout>
      <div className="card" style={{ borderRadius: 16, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Behavior Events</div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
          Click Preview to watch the exact video segment for this behavior.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table role="table" aria-label="Behavior Events" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Start</th>
                <th style={thStyle}>End</th>
                <th style={thStyle}>Duration (min)</th>
                <th style={thStyle}>Confidence</th>
                <th style={thStyle}>Camera</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b, idx) => (
                <tr key={`row-${idx}`} style={{ borderBottom: `1px solid ${themeTokens.border}` }}>
                  <td style={tdStyle}>{b.type}</td>
                  <td style={tdStyle}>{b.start}</td>
                  <td style={tdStyle}>{b.end}</td>
                  <td style={tdStyle}>{b.durationMin}</td>
                  <td style={tdStyle}>{Math.round(b.confidence * 100)}%</td>
                  <td style={tdStyle}>{b.camera}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthedLayout>
  );
}
const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: `1px solid ${themeTokens.border}`,
  color: themeTokens.text,
};
const tdStyle = {
  padding: '10px 12px',
  color: themeTokens.text,
  borderBottom: `1px solid ${themeTokens.border}`,
  fontSize: 14,
};

// PUBLIC_INTERFACE
function ReportsPage() {
  // revert to basic builder without scheduling/templates and simple preview
  const [type, setType] = useState('Behavior Duration Analysis');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [behavior, setBehavior] = useState('All');
  const [hours, setHours] = useState(24);

  const BEHAVIORS = ['All', 'Resting', 'Feeding', 'Moving'];

  const helper = 'Use Behavior, Date Range, and Hours to refine the report. Use the buttons to export current view (mock).';

  const downloadMock = (kind) => {
    const content = `VizAI Report (${kind})
Type: ${type}
Behavior: ${behavior}
Date Range: ${dateRange}
Hours: ${hours}
Generated: ${new Date().toISOString()}
`;
    const blob = new Blob([content], { type: kind === 'PDF' ? 'application/pdf' : 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vizai-report-${Date.now()}.${kind === 'PDF' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          Reports – Generate summaries, trends, and welfare assessments.
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          {helper}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
        <div className="card" style={{ borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Report Builder</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={filterLabel}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
                <option>Behavior Duration Analysis</option>
                <option>Summary</option>
                <option>Daily Pattern</option>
              </select>
            </div>
            <div>
              <label style={filterLabel}>Behavior</label>
              <select value={behavior} onChange={(e) => setBehavior(e.target.value)} style={selectStyle}>
                {BEHAVIORS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={filterLabel}>Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={selectStyle}>
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom…</option>
              </select>
            </div>
            <div>
              <label style={filterLabel}>Hours</label>
              <input
                type="number"
                min={1}
                max={720}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value || 0))}
                style={{ ...selectStyle, appearance: 'textfield' }}
                aria-label="Hours"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={primaryBtnStyle} onClick={() => downloadMock('PDF')}>Download PDF</button>
              <button type="button" style={primaryGhostBtnStyle} onClick={() => downloadMock('Excel')}>Download Excel</button>
            </div>
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>
            Preview {type === 'Behavior Duration Analysis' ? '• Behavior Duration Analysis' : ''}
          </div>
          <EmptyState
            title={type === 'Behavior Duration Analysis' ? 'No behavior duration data available for this period.' : 'Report Preview'}
            description={type === 'Behavior Duration Analysis' ? '' : `Type: ${type} • Behavior: ${behavior} • Range: ${dateRange} • Hours: ${hours}`}
          />
        </div>
      </div>
    </AuthedLayout>
  );
}

const filterLabel = { fontSize: 12, color: 'var(--muted)', fontWeight: 700 };
const selectStyle = {
  width: '100%',
  background: 'var(--surface)',
  border: `1px solid ${themeTokens.border}`,
  color: themeTokens.text,
  padding: '8px 10px',
  borderRadius: 12,
  marginTop: 6,
  boxShadow: themeTokens.shadow,
};

// PUBLIC_INTERFACE
function SummaryStat({ label, value }) {
  /** A compact stat card used on the Dashboard summary row. */
  return (
    <div className="card" style={{ padding: 12, borderRadius: 16 }}>
      <div className="muted" style={{ fontSize: 12, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 20 }}>{value}</div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Layout wrapper: NavBar + page container. No onboarding wizard, no unified sidebar, no extra tabs.
 */
function AuthedLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text }}>
      <NavBar />
      <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Route guard for authed sections.
 */
function ProtectedRoute({ children }) {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

/**
 * PUBLIC_INTERFACE
 * App root provider and router.
 */
function App() {
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState('researcher');

  useEffect(() => {}, []);

  const authValue = useMemo(() => ({ authed, setAuthed, role, setRole }), [authed, role]);

  return (
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-animal" element={
            <ProtectedRoute>
              <AnimalSelectPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/timeline" element={
            <ProtectedRoute>
              <TimelinePage />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
