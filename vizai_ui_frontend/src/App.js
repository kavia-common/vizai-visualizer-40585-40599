import React, { useEffect, useMemo, useState, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './index.css';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * Tokens are driven by CSS variables. This map reads from getComputedStyle for inline styles.
 */
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name) || '';
const themeTokens = {
  get primary() { return cssVar('--primary').trim() || '#1e8a5b'; },
  get primary600() { return cssVar('--primary-600').trim() || '#177148'; },
  get secondary() { return cssVar('--secondary').trim() || '#F59E0B'; },
  get error() { return cssVar('--error').trim() || '#DC2626'; },
  get background() { return cssVar('--bg').trim() || '#F3F4F6'; },
  get surface() { return cssVar('--surface').trim() || '#FFFFFF'; },
  get text() { return cssVar('--text').trim() || '#111827'; },
  get gradient() { return cssVar('--gradient').trim() || 'linear-gradient(135deg,#1e8a5b 0%,#34d399 100%)'; },
  get subtle() { return cssVar('--table-header-bg').trim() || '#F9FAFB'; },
  get border() { return cssVar('--border').trim() || '#E5E7EB'; },
  get shadow() { return cssVar('--shadow').trim() || '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)'; },
};

/**
 * PUBLIC_INTERFACE
 * Basic feature flags from env (phase gating). Use REACT_APP_FEATURE_FLAGS JSON.
 */
const featureFlags = (() => {
  try {
    const raw = process.env.REACT_APP_FEATURE_FLAGS || '{}';
    return JSON.parse(raw);
  } catch {
    return {};
  }
})();

/**
 * PUBLIC_INTERFACE
 * AuthContext simulates signed-in state for route guarding and stores role/species/date preferences
 */
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export const useAuth = () => useContext(AuthContext);

/**
 * PUBLIC_INTERFACE
 * StatusBadge component: Active, Resting, Feeding
 */
function StatusBadge({ status }) {
  /** Badge uses primary/secondary palette via CSS variables */
  const map = {
    Active: { bg: 'rgba(30,138,91,0.12)', color: themeTokens.primary },
    Resting: { bg: 'rgba(107,114,128,0.18)', color: 'var(--muted)' },
    Feeding: { bg: 'rgba(245,158,11,0.18)', color: themeTokens.secondary },
  };
  const cfg = map[status] || map.Active;
  return (
    <span
      className="badge"
      style={{
        background: cfg.bg,
        color: cfg.color,
      }}
      aria-label={`status ${status}`}
      title={`Behavior status: ${status}`}
    >
      <span style={{
        width: 8, height: 8, borderRadius: 999, background: cfg.color
      }} />
      {status}
    </span>
  );
}

/**
 * PUBLIC_INTERFACE
 * ConnectionBanner: togglable banner for demo
 */
function ConnectionBanner({ visible, message }) {
  if (!visible) return null;
  return (
    <div role="status" style={{
      width: '100%',
      background: 'rgba(220,38,38,0.12)',
      color: themeTokens.error,
      padding: '8px 16px',
      textAlign: 'center',
      fontWeight: 600,
      borderBottom: `1px solid ${themeTokens.border}`
    }}>
      {message}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * DateRangeSelector: Today, Last 7 Days, Last 30 Days, Custom…
 */
function DateRangeSelector({ value, onChange }) {
  const options = ['Today', 'Last 7 Days', 'Last 30 Days', 'Custom…'];
  return (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Date Range</span>
      <select
        aria-label="Date Range"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: themeTokens.surface,
          color: themeTokens.text,
          border: `1px solid ${themeTokens.border}`,
          borderRadius: 12,
          padding: '8px 12px',
          fontWeight: 600,
          boxShadow: themeTokens.shadow,
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Layout components
 */
function Logo() {
  /**
   * Brand logo only (no adjacent text).
   * - Explicit size 32x32 via CSS variable fallback
   * - Accessibility: alt and title for tooltip
   * - CSS safeguards ensure visibility and sizing
   */
  const size = 'var(--brand-icon-size, 32px)';
  return (
    <img
      src="/assets/vizai-logo.png"
      alt="VizAI Logo"
      width={32}
      height={32}
      title="Return to Dashboard"
      aria-hidden={false}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'none',
        opacity: 1,
        visibility: 'visible',
        maxWidth: 'none',
        maxHeight: 'none',
      }}
    />
  );
}

/**
 * PUBLIC_INTERFACE
 * NavBar: Logo, Tabs, User badge (Species/Date moved to left panel per requirement)
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
      navigate('/select-animal');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="nav" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--nav-padding)', position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onBrandClick}
          title="Return to Dashboard"
          aria-label="VizAI Home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: 6,
            borderRadius: 10,
            border: `1px solid transparent`,
            background: 'transparent',
            cursor: 'pointer',
          }}
          className="focus-ring"
        >
          <Logo />
          <span className="sr-only">VizAI Home</span>
        </button>

        <div style={{ marginLeft: 8, display: 'flex', gap: 4 }}>
          <Link to="/dashboard" style={tabStyle(isActive('/dashboard'))} title="Overview metrics">
            Dashboard
          </Link>
          <Link to="/timeline" style={tabStyle(isActive('/timeline'))} title="Behavior Explorer">
            Timeline
          </Link>
          <Link to="/reports" style={tabStyle(isActive('/reports'))} title="Generate reports">
            Reports
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          border: `1px solid ${themeTokens.border}`, borderRadius: 12, background: 'var(--surface)', boxShadow: themeTokens.shadow
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: '#22C55E' }} />
          <span style={{ fontWeight: 700 }}>user@viz.ai</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty & Error States (global)
 */
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
 * VideoModal with playback controls, AI annotations toggle, metadata panel and basic error handling
 */
function VideoModal({ open, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showAI, setShowAI] = useState(true);
  const [error, setError] = useState('');
  const playerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      setSpeed(1);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const togglePlay = () => {
    if (error) return;
    setPlaying(p => !p);
  };

  const cycleSpeed = () => {
    setSpeed(s => {
      const next = s === 1 ? 1.5 : s === 1.5 ? 2 : 1;
      return next;
    });
  };

  const simulateError = () => {
    setError('Unable to load video stream. Please try again later.');
    setPlaying(false);
  };

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50
    }}>
      <div style={{
        background: themeTokens.surface, border: `1px solid ${themeTokens.border}`,
        borderRadius: 16, width: 'min(100%, 980px)', overflow: 'hidden', color: themeTokens.text, boxShadow: themeTokens.shadow
      }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${themeTokens.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--table-header-bg)' }}>
          <div style={{ fontWeight: 800 }}>Video Preview</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={primaryGhostBtnStyle} onClick={() => setShowAI(v => !v)} title="Toggle AI annotations">
              {showAI ? 'Hide AI' : 'Show AI'}
            </button>
            <button onClick={onClose} style={primaryGhostBtnStyle} title="Close">Close</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, padding: 16 }}>
          <div
            ref={playerRef}
            style={{
              background: 'var(--bg)', border: `1px solid ${themeTokens.border}`, borderRadius: 12,
              height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', position: 'relative'
            }}
          >
            {error ? (
              <ErrorState message={error} />
            ) : (
              <>
                <div>[ Placeholder Player {playing ? 'Playing' : 'Paused'} @ {speed}x ]</div>
                {showAI && (
                  <div style={{
                    position: 'absolute', bottom: 12, left: 12, background: 'rgba(30,138,91,0.15)', border: `1px solid ${themeTokens.border}`,
                    color: themeTokens.text, padding: '6px 8px', borderRadius: 8, fontSize: 12
                  }}>
                    AI: Moving (0.92)
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Metadata</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#D1D5DB', lineHeight: 1.8 }}>
              <li>Species: Giant Anteater</li>
              <li>Behavior: Moving</li>
              <li>Confidence: 0.92</li>
              <li>Timestamp: 2025-01-22 14:37:09</li>
              <li>Source: {process.env.REACT_APP_BACKEND_URL || 'mock://video'}</li>
            </ul>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button style={primaryBtnStyle} title="Download video (mock)">Download</button>
              <button style={primaryGhostBtnStyle} title="Open this time in Timeline">Open in Timeline</button>
              <button style={primaryGhostBtnStyle} onClick={simulateError} title="Simulate error">Sim Error</button>
            </div>
          </div>
        </div>
        <div style={{ padding: 16, borderTop: `1px solid ${themeTokens.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={controlBtnStyle} title="Previous">⏮</button>
          <button style={controlBtnStyle} onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>{playing ? '⏸' : '▶️'}</button>
          <button style={controlBtnStyle} title="Next">⏭</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button style={primaryGhostBtnStyle} onClick={cycleSpeed} title="Playback speed">{speed}x</button>
            <button style={primaryGhostBtnStyle} title="Closed captions">CC</button>
            <button style={primaryGhostBtnStyle} title="High Definition">HD</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Button styles
 */
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
const controlBtnStyle = {
  background: 'var(--surface)',
  color: themeTokens.text,
  fontWeight: 800,
  border: `1px solid ${themeTokens.border}`,
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
  boxShadow: themeTokens.shadow,
};

/**
 * Shared constants
 */
const BEHAVIOR_CATEGORIES = [
  'Recumbent',
  'Non-Recumbent',
  'Scratching',
  'Self-Directed',
  'Pacing',
  'Moving',
];

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

/**
 * Left panel component used on authed pages: includes Species and Date Range per requirement.
 */
function LeftPanelFilters({ species, setSpecies, dateRange, setDateRange, extraChildren }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ padding: 16, borderRadius: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Global Filters</div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Species</label>
            <select
              aria-label="Species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface)',
                color: themeTokens.text,
                border: `1px solid ${themeTokens.border}`,
                borderRadius: 12,
                padding: '8px 12px',
                fontWeight: 700,
                boxShadow: themeTokens.shadow,
                marginTop: 6
              }}
            >
              <option value="Giant Anteater">Giant Anteater</option>
              <option value="Pangolin" disabled>pangolin (Coming Soon)</option>
              <option value="Sloth" disabled>sloth (Coming Soon)</option>
            </select>
          </div>
          <div>
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>
      {extraChildren}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * RegistrationPage visible field for Role; after login role hidden but used internally.
 */
function RegistrationPage() {
  const navigate = useNavigate();
  const { setAuthed, setUser } = useAuth();
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  // Role options used in registration only (visible here, hidden post-login)
  const ROLES = ['Researcher', 'Field Observer', 'Admin'];

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '');
    const password = String(fd.get('password') || '');
    const confirm = String(fd.get('confirm') || '');
    const role = String(fd.get('role') || '');
    if (!email || !password || !confirm || !role) {
      setError('Please complete all fields including role selection.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    // Persist in context (mock). Role is used internally but not shown post-login.
    setUser({ email, role });
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
        <div className="title" style={{ textAlign: 'center', fontWeight: 900, marginBottom: 6 }}>Create Your VizAI Account</div>
        <div className="subtitle" style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 20 }}>
          Register to access dashboards, timeline, and reports.
        </div>

        <label style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Email Address</label>
        <input name="email" type="email" placeholder="Enter your email" style={inputStyle} aria-label="Email Address" />

        <label style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Password</label>
        <input name="password" type="password" placeholder="Create a strong password" style={inputStyle} aria-label="Password" />

        <label style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Confirm Password</label>
        <input name="confirm" type="password" placeholder="Re-enter your password" style={inputStyle} aria-label="Confirm Password" />

        <label style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Select Role</label>
        <select name="role" style={{ ...inputStyle, marginTop: 6 }} aria-label="Select Role">
          <option value="">Choose your role…</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: -8, marginBottom: 12 }}>
          Choose your role for personalized access
        </div>

        {error ? <ErrorState message={error} /> : null}
        <button type="submit" style={{ ...primaryBtnStyle, width: '100%', marginTop: 12 }} title="Register & Continue">Register & Continue</button>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link to="/login" title="Already have an account? Log in">Already have an account? Log in</Link>
        </div>
      </form>
    </div>
  );
}

// PUBLIC_INTERFACE
function LoginPage() {
  const { setAuthed, setUser } = useAuth();
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
    // Login uses stored role internally if available; do not prompt for role here
    setUser((prev) => prev?.role ? { ...(prev || {}), email } : { email, role: 'Researcher' });
    setAuthed(true);
    navigate('/select-animal', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text, display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={onSubmit} style={{
        width: 'min(100%, 440px)', background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 24, boxShadow: themeTokens.shadow
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo />
        </div>
        <div className="title" style={{ textAlign: 'center', fontWeight: 900, marginBottom: 6 }}>Welcome to VizAI</div>
        <div className="subtitle" style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 20 }}>
          Sign in with your research account to continue.
        </div>
        <label style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Email</label>
        <input name="email" type="email" placeholder="name@research.org" style={inputStyle} />
        <label style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>Password</label>
        <input name="password" type="password" placeholder="••••••••" style={inputStyle} />
        {error ? <ErrorState message={error} /> : null}
        <button type="submit" style={{ ...primaryBtnStyle, width: '100%', marginTop: 12 }}>Sign In</button>
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <Link to="/register" title="Create account">No account? Create one</Link>
        </div>
        <div style={{ marginTop: 12, color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
          By continuing you agree to our research-friendly terms.
        </div>
      </form>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Animal selection remains unchanged.
 */
function AnimalSelectPage() {
  const [query, setQuery] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);

  // Mock species list with expected availability
  const speciesList = [
    { key: 'anteater', name: 'Giant Anteater', subtitle: 'Myrmecophaga tridactyla', active: true, expected: null, img: '/assets/giant-anteater.png' },
    { key: 'pangolin', name: 'Pangolin', subtitle: 'Coming Soon', active: false, expected: 'Expected: Feb 2026', img: '/assets/pangolin.png' },
    { key: 'sloth', name: 'Sloth', subtitle: 'Coming Soon', active: false, expected: 'Expected: Sep 2025', img: '/assets/sloth.png' },
  ];

  const filtered = speciesList.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

  const EmptySpecies = (
    <EmptyState
      title="No animals available yet. Check back soon or request a species."
      description=""
    />
  );

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900, fontSize: 20, flex: '0 0 auto' }}>Select an Animal to Monitor</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              aria-label="Search species"
              placeholder="Search species…"
              style={{ ...inputStyle, margin: 0, width: 260 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              style={primaryGhostBtnStyle}
              title="Jump back to animals you monitored recently"
              aria-label="Recently Monitored"
            >
              Recently Monitored
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 12, borderRadius: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
            Tip: Behavior terms remain consistent across Dashboard, Timeline, and Reports for easy analysis.
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {EmptySpecies}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(true)} title="Request a species">
                Request a Species
              </button>
              <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(true)} title="Suggest a new species">
                Suggest a new species
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
            {filtered.map(s => (
              <SpeciesCard key={s.key} data={s} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(true)} title="Request a species">
            Request a Species
          </button>
          <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(true)} title="Suggest a new species">
            Suggest a new species
          </button>
        </div>
      </div>

      {showSuggest && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
          <div className="card" style={{ width: 420, padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Suggest a new species</div>
            <div className="muted" style={{ marginBottom: 10, fontSize: 14 }}>
              This is a placeholder form. Submit to simulate interest (no backend yet).
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Species Name</label>
              <input style={inputStyle} placeholder="e.g., Red Panda" aria-label="Species Name" />
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Why should we add it?</label>
              <textarea style={{ ...inputStyle, minHeight: 96 }} placeholder="Brief rationale…" aria-label="Reason" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(false)}>Cancel</button>
              <button style={primaryBtnStyle} onClick={() => { alert('Thanks! We will review your suggestion.'); setShowSuggest(false); }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </AuthedLayout>
  );
}

function SpeciesCard({ data }) {
  const { name, subtitle, active, expected, img } = data;
  const imgFallback = (
    <div style={{
      height: 120,
      background: 'linear-gradient(135deg, rgba(30,138,91,0.12), rgba(245,158,11,0.12))',
      borderRadius: 12,
      border: `1px solid ${themeTokens.border}`,
      display: 'grid', placeItems: 'center', color: 'var(--muted)'
    }}>
      {name}
    </div>
  );

  const imageEl = img ? (
    <div style={{
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      border: `1px solid ${themeTokens.border}`,
      background: 'var(--surface)',
      display: 'grid',
      placeItems: 'center'
    }}>
      <img src={img} alt={`${name} image`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  ) : imgFallback;

  return (
    <div className="card" style={{ borderRadius: 16, padding: 16 }}>
      {imageEl}
      <div style={{ fontWeight: 800, marginTop: 10 }}>{name}</div>
      <div className="muted" style={{ marginBottom: 8 }}>{subtitle}</div>
      {expected && !active ? (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{expected}</div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {active ? (
          <>
            <Link
              to="/dashboard"
              style={{ ...primaryBtnStyle, textDecoration: 'none' }}
              title="Begin tracking this animal now"
              aria-label={`Start Monitoring ${name}`}
            >
              Start Monitoring
            </Link>
            <button style={primaryGhostBtnStyle} title="Open details" aria-label={`View Details for ${name}`}>View Details</button>
          </>
        ) : (
          <>
            <button style={primaryBtnStyle} title="Get an alert when this species becomes available" aria-label={`Notify me about ${name}`}>
              Notify Me
            </button>
            <button style={primaryGhostBtnStyle} title="Open details" aria-label={`Details for ${name}`}>Details</button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Dashboard with interactive pie/stacked legend to navigate to Timeline with filter
 */
function DashboardPage() {
  const [openVideo, setOpenVideo] = useState(false);

  const [durationMode, setDurationMode] = useState('duration'); // count|duration
  const [pieMode, setPieMode] = useState(true); // stacked/pie toggle (mocked)

  const mockCounts = {
    'Recumbent': 22,
    'Non-Recumbent': 15,
    'Scratching': 7,
    'Self-Directed': 10,
    'Pacing': 5,
    'Moving': 19,
  };
  const totalCount = BEHAVIOR_CATEGORIES.reduce((sum, k) => sum + (mockCounts[k] || 0), 0);

  const mockDurations = {
    'Recumbent': 485,
    'Non-Recumbent': 210,
    'Scratching': 35,
    'Self-Directed': 65,
    'Pacing': 40,
    'Moving': 205,
  };
  const totalDuration = BEHAVIOR_CATEGORIES.reduce((sum, k) => sum + (mockDurations[k] || 0), 0);

  function formatHhMm(mins) {
    const h = Math.floor((mins || 0) / 60);
    const m = (mins || 0) % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
  const piePalette = [
    themeTokens.primary,
    themeTokens.secondary,
    '#0EA5E9',
    '#22C55E',
    '#F43F5E',
    themeTokens.primary600,
  ];
  const barPalette = [
    themeTokens.primary,
    themeTokens.secondary,
    '#10B981',
    '#6366F1',
    '#F59E0B',
    themeTokens.primary600,
  ];
  function pieColor(i) { return piePalette[i % piePalette.length]; }
  function barColor(i) { return barPalette[i % barPalette.length]; }
  function conicGradientFromData(keys, dataMap, total) {
    let acc = 0;
    const parts = [];
    keys.forEach((k, idx) => {
      const mins = (dataMap[k] || 0);
      const frac = total ? mins / total : 0;
      const start = acc * 100;
      const end = (acc + frac) * 100;
      const color = pieColor(idx);
      parts.push(`${color} ${start}% ${end}%`);
      acc += frac;
    });
    return parts.length ? `conic-gradient(${parts.join(', ')})` : themeTokens.primary;
  }

  const navigate = useNavigate();
  const onPieClick = () => navigate('/timeline?behavior=Moving');

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          <ChartBlock title="Behavior Count">
            {totalCount === 0 ? (
              <EmptyState title="No behaviors found" description="Try expanding your date range." />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {BEHAVIOR_CATEGORIES.map(b => (
                  <div key={b} style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                      <span>{b}</span>
                      <span>{mockCounts[b] ?? 0}</span>
                    </div>
                    <div style={{
                      height: 10, background: 'var(--table-row-hover)', border: `1px solid ${themeTokens.border}`, borderRadius: 999, overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((mockCounts[b] ?? 0) / Math.max(1, totalCount)) * 100}%`,
                        background: themeTokens.gradient, height: '100%'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartBlock>

          <ChartBlock title="Behavior Duration">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8, alignItems: 'center' }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>View</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  style={{ ...primaryGhostBtnStyle, background: durationMode === 'count' ? 'rgba(30,138,91,0.12)' : 'transparent' }}
                  onClick={() => setDurationMode('count')}
                  title="Show by count"
                >
                  Count
                </button>
                <button
                  style={{ ...primaryGhostBtnStyle, background: durationMode === 'duration' ? 'rgba(245,158,11,0.12)' : 'transparent' }}
                  onClick={() => setDurationMode('duration')}
                  title="Show by duration"
                >
                  Duration
                </button>
                <button
                  style={{ ...primaryGhostBtnStyle, background: pieMode ? 'rgba(59,130,246,0.12)' : 'transparent' }}
                  onClick={() => setPieMode(true)}
                  title="Pie chart view"
                >
                  Pie
                </button>
                <button
                  style={{ ...primaryGhostBtnStyle, background: !pieMode ? 'rgba(59,130,246,0.12)' : 'transparent' }}
                  onClick={() => setPieMode(false)}
                  title="Stacked bar view"
                >
                  Stacked Bar
                </button>
              </div>
            </div>

            {durationMode === 'count' ? (
              <EmptyState title="Count mode" description="Showing distribution by event count (mocked)." />
            ) : totalDuration === 0 ? (
              <EmptyState title="No behavior duration data available for this period." description="" />
            ) : (
              <>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  {pieMode ? 'Behavior Duration – Pie View' : 'Behavior Duration – Stacked Bar View'}
                </div>

                {pieMode ? (
                  <div role="img" aria-label="Pie chart of behavior duration percentages"
                       style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {BEHAVIOR_CATEGORIES.map((b, idx) => {
                        const mins = mockDurations[b] || 0;
                        const pct = totalDuration ? Math.round((mins / totalDuration) * 100) : 0;
                        const color = pieColor(idx);
                        return (
                          <button key={b}
                                  onClick={() => navigate(`/timeline?behavior=${encodeURIComponent(b)}`)}
                                  title={`${b}: ${formatHhMm(mins)} (${pct}%) • Click to view in Timeline`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${themeTokens.border}`, padding: '6px 8px', borderRadius: 10, background: 'var(--surface)', cursor: 'pointer' }}>
                            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: color, boxShadow: themeTokens.shadow }} />
                            <span style={{ fontSize: 12, color: themeTokens.text }}>{b}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div
                      onClick={onPieClick}
                      style={{
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        border: `1px solid ${themeTokens.border}`,
                        boxShadow: themeTokens.shadow,
                        background: conicGradientFromData(BEHAVIOR_CATEGORIES, mockDurations, totalDuration),
                        margin: '8px auto',
                        cursor: 'pointer'
                      }}
                      title="Pie chart (click to open Timeline with filter)"
                    />
                  </div>
                ) : (
                  <div role="img" aria-label="Stacked bar chart of behavior duration in hours"
                       style={{ display: 'grid', gap: 8 }}>
                    <div style={{
                      height: 20,
                      background: 'var(--table-row-hover)',
                      border: `1px solid ${themeTokens.border}`,
                      borderRadius: 999,
                      overflow: 'hidden',
                      display: 'flex'
                    }}
                      title="Cumulative time distribution across behaviors"
                    >
                      {BEHAVIOR_CATEGORIES.map((b, idx) => {
                        const mins = mockDurations[b] || 0;
                        const widthPct = totalDuration ? (mins / totalDuration) * 100 : 0;
                        const color = barColor(idx);
                        return (
                          <div
                            key={b}
                            style={{ width: `${widthPct}%`, background: color }}
                            title={`${b}: ${formatHhMm(mins)}`}
                            aria-label={`${b}: ${formatHhMm(mins)}`}
                            onClick={() => navigate(`/timeline?behavior=${encodeURIComponent(b)}`)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </ChartBlock>

          <ChartBlock title="Daily Activity Pattern">
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
          </ChartBlock>
        </div>
        <div>
          <button style={primaryBtnStyle} onClick={() => setOpenVideo(true)}>Open Video Modal</button>
        </div>
      </div>
      <VideoModal open={openVideo} onClose={() => setOpenVideo(false)} />
    </AuthedLayout>
  );
}

function ChartBlock({ title, children }) {
  return (
    <div className="card" style={{
      borderRadius: 16, padding: 16
    }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Timeline supports behavior filter via query param and shows left panel with species/date
 */
function TimelinePage() {
  const [view, setView] = useState('grid');
  const [zoom, setZoom] = useState(100);
  const [count, setCount] = useState(12);
  const [openVideo, setOpenVideo] = useState(false);
  const [searchParams] = useSearchParams();
  const initialBehavior = searchParams.get('behavior') || 'All';

  return (
    <AuthedLayout>
      <TimelineWithLeftPanel initialBehavior={initialBehavior} view={view} setView={setView} zoom={zoom} setZoom={setZoom} count={count} setCount={setCount} openVideo={openVideo} setOpenVideo={setOpenVideo} />
    </AuthedLayout>
  );
}

function TimelineWithLeftPanel({ initialBehavior, view, setView, zoom, setZoom, count, setCount, openVideo, setOpenVideo }) {
  const { species, setSpecies, dateRange, setDateRange } = useAuth();
  const [behaviorFilter, setBehaviorFilter] = useState(initialBehavior);

  useEffect(() => {
    // mock re-count when behavior changes
    setCount(behaviorFilter === 'All' ? 12 : 7);
  }, [behaviorFilter, setCount]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
      <LeftPanelFilters species={species} setSpecies={setSpecies} dateRange={dateRange} setDateRange={setDateRange}
        extraChildren={
          <div className="card" style={{ padding: 16, borderRadius: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Timeline Filters</div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Behavior Type</label>
              <select style={selectStyle} aria-label="Behavior Type" value={behaviorFilter} onChange={(e) => setBehaviorFilter(e.target.value)}>
                <option>All</option>
                {BEHAVIOR_CATEGORIES.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        }
      />
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#9CA3AF' }}>{count} results</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={controlBtnStyle} onClick={() => setZoom(z => Math.max(25, z - 25))} title="Zoom out">-</button>
            <div style={{ minWidth: 48, textAlign: 'center' }}>{zoom}%</div>
            <button style={controlBtnStyle} onClick={() => setZoom(z => Math.min(200, z + 25))} title="Zoom in">+</button>
            <button style={{ ...primaryGhostBtnStyle, background: view === 'grid' ? 'rgba(52,211,153,0.12)' : 'transparent' }} onClick={() => setView('grid')}>Grid</button>
            <button style={{ ...primaryGhostBtnStyle, background: view === 'list' ? 'rgba(52,211,153,0.12)' : 'transparent' }} onClick={() => setView('list')}>List</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(240px,1fr))' : '1fr', gap: 12 }}>
          {Array.from({ length: count }).map((_, i) => (
            <BehaviorEventCard key={i} onOpenVideo={() => setOpenVideo(true)} />
          ))}
        </div>
      </div>
      <VideoModal open={openVideo} onClose={() => setOpenVideo(false)} />
    </div>
  );
}

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

function BehaviorEventCard({ onOpenVideo }) {
  return (
    <div className="card" style={{
      borderRadius: 14,
      overflow: 'hidden'
    }}>
      <div style={{ height: 120, background: 'var(--table-row-hover)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
        [ Thumbnail ]
      </div>
      <div style={{ padding: 12, display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusBadge status="Active" />
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>14:37:09</span>
        </div>
        <div style={{ color: '#D1D5DB' }}>Behavior: Moving • Confidence: 0.92</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={primaryGhostBtnStyle} onClick={onOpenVideo}>View Video</button>
          <button style={primaryGhostBtnStyle} title="Open details">Open</button>
        </div>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * ReportsPage with Behavior dropdown, date range, hours filters, and mock PDF/Excel download actions
 */
function ReportsPage() {
  const { species, dateRange, setDateRange } = useAuth();
  const [type, setType] = useState('Behavior Duration Analysis');
  const [behavior, setBehavior] = useState('All');
  const [hours, setHours] = useState('All Day');
  const [openExport, setOpenExport] = useState(false);
  const [downloading, setDownloading] = useState('');

  const isBehaviorDuration = type === 'Behavior Duration Analysis';

  const triggerDownload = async (fmt) => {
    setDownloading(fmt);
    // mock async
    await new Promise(r => setTimeout(r, 700));
    alert(`Mock ${fmt.toUpperCase()} export queued.\nType: ${type}\nSpecies: ${species}\nBehavior: ${behavior}\nDate Range: ${dateRange}\nHours: ${hours}`);
    setDownloading('');
  };

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="card" style={{ borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Report Builder</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
                <option>Behavior Duration Analysis</option>
                <option>Summary</option>
                <option>Daily Pattern</option>
              </select>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              {isBehaviorDuration
                ? 'Shows total time spent in each behavior across selected date range.'
                : 'Choose a report type to see its description.'}
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={selectStyle}>
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom…</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Behavior</label>
              <select value={behavior} onChange={(e) => setBehavior(e.target.value)} style={selectStyle}>
                <option>All</option>
                {BEHAVIOR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Hours</label>
              <select value={hours} onChange={(e) => setHours(e.target.value)} style={selectStyle}>
                <option>All Day</option>
                <option>Daytime</option>
                <option>Nighttime</option>
                <option>Custom…</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={primaryBtnStyle} onClick={() => setOpenExport(true)}>Export</button>
              <button style={primaryGhostBtnStyle} onClick={() => triggerDownload('pdf')} disabled={!!downloading}>
                {downloading === 'pdf' ? 'Preparing PDF…' : 'Download PDF (mock)'}
              </button>
              <button style={primaryGhostBtnStyle} onClick={() => triggerDownload('excel')} disabled={!!downloading}>
                {downloading === 'excel' ? 'Preparing Excel…' : 'Download Excel (mock)'}
              </button>
            </div>
            <div style={{ color: '#9CA3AF', fontSize: 12 }}>
              Exports may take a few minutes. You can continue exploring while we generate your report.
            </div>
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>
            Preview {isBehaviorDuration ? '• Behavior Duration Analysis' : ''}
          </div>
          <EmptyState
            title={isBehaviorDuration ? 'No behavior duration data available for this period.' : 'Report Preview'}
            description={isBehaviorDuration ? '' : 'Preview placeholder for selected type and parameters.'}
          />
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            Filters applied — Species: <b>{species}</b>, Behavior: <b>{behavior}</b>, Date Range: <b>{dateRange}</b>, Hours: <b>{hours}</b>
          </div>
        </div>
      </div>
      {openExport && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 60
        }}>
          <div className="card" style={{ width: 420, padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Export Report</div>
            <div style={{ color: '#D1D5DB', marginBottom: 16 }}>
              Your report "{type}" for {dateRange} is being generated. We will notify you when it’s ready.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={primaryGhostBtnStyle} onClick={() => setOpenExport(false)}>Close</button>
              <button style={primaryBtnStyle} onClick={() => setOpenExport(false)}>Okay</button>
            </div>
          </div>
        </div>
      )}
    </AuthedLayout>
  );
}



/**
 * Layout wrapper for authenticated pages:
 * includes ConnectionBanner and NavBar
 * Adds left panel layout option and stores species/date in auth context for app-wide usage.
 */
function AuthedLayout({ children }) {
  const { connLost, setConnLost } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text }}>
      <ConnectionBanner
        visible={true}
        message={connLost ? 'Connection Status: Offline – Check your network' : 'Connection Status: Online'}
      />
      <NavBar />
      <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span title="Project status" style={{ fontSize: 12, color: 'var(--muted)' }}>
            Environment: {process.env.REACT_APP_NODE_ENV || 'development'} • API: {process.env.REACT_APP_API_BASE || 'mock'}
          </span>
        </div>
        {children}
        <div style={{ marginTop: 16 }}>
          <button style={primaryGhostBtnStyle} onClick={() => setConnLost(v => !v)}>
            Toggle Connection Status
          </button>
          <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 12 }}>
            Tip: Behavior terms remain consistent across Dashboard, Timeline, and Reports for easy analysis.
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Root App with Router and protected routes
 */
function ProtectedRoute({ children }) {
  const { authed } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  return children;
}

// PUBLIC_INTERFACE
function App() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null); // { email, role }
  const [connLost, setConnLost] = useState(false);
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [species, setSpecies] = useState('Giant Anteater');

  useEffect(() => {
    // Theme is controlled via CSS variables; no explicit attribute required.
  }, []);

  const authValue = useMemo(() => ({
    authed, setAuthed,
    user, setUser,
    connLost, setConnLost,
    dateRange, setDateRange,
    species, setSpecies
  }), [authed, user, connLost, dateRange, species]);

  return (
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
