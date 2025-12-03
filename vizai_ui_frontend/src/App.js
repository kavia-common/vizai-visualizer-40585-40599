import React, { useEffect, useMemo, useState, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import './index.css';
import './App.css';
import AIHelpChat from './components/AIHelpChat';

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
 * AuthContext simulates signed-in state for route guarding
 */
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export const useAuth = () => useContext(AuthContext);

/**
 * PUBLIC_INTERFACE
 * Role helper to normalize role labels used across UI.
 */
const ROLE_LABELS = {
  keeper: 'Animal Keeper',
  researcher: 'Researcher',
  veterinarian: 'Veterinarian',
};

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
function ConnectionBanner({ visible, message = 'Connection lost. Reconnecting…' }) {
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
   * Brand logo + text.
   * - Icon fixed to 64x64 per spec
   * - Flex alignment with a 12px gap handled via CSS
   * - Accessibility preserved: <img alt="VizAI Logo">; tooltip on image; wrapper ARIA via parent button
   */
  const sizePx = 64;

  return (
    <div
      className="brand"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1,
        color: 'var(--text)',
        gap: '8px',                // exact 8px gap between icon and text
        marginLeft: '16px',        // exact left margin from viewport edge
        padding: 0,
      }}
      aria-label="VizAI brand"
    >
      <img
        src="/assets/vizai-logo-20251203.png"
        alt="VizAI Logo"
        width={sizePx}
        height={sizePx}
        aria-hidden={false}
        style={{
          display: 'inline-block',
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          objectFit: 'contain',
          borderRadius: 12,         // rounded square per spec
          filter: 'none',
          opacity: 1,
          visibility: 'visible',
          maxWidth: 'none',
          maxHeight: 'none',
          margin: 0,
          padding: 0,
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
          margin: 0,
          padding: 0,
          fontSize: '28px',          // enforce 28px text size
          color: '#1e8a5b',          // brand color
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
 * NavBar with logo, species dropdown, tabs, date selector, user menu.
 * Displays "Logged in as: <Role>" sourced from AuthContext role.
 */
function NavBar({ dateRange, setDateRange, showChatTab, species, setSpecies }) {
  // Note: showChatTab retained but header simplified to only logo and tabs; species/date move to sidebar.
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
    <div className="nav" style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignItems: 'center',
      gap: 16,
      padding: 'var(--nav-padding)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* [Logo + VizAI] */}
      <button
        onClick={onBrandClick}
        title="Go to Dashboard"
        aria-label="VizAI Home"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: 6,
          borderRadius: 10,
          border: `1px solid transparent`,
          background: 'transparent',
          cursor: 'pointer',
          marginLeft: 0
        }}
        className="focus-ring"
      >
        <Logo />
        <span className="sr-only" aria-hidden="true">VizAI Home</span>
      </button>

      {/* [Dashboard|Timeline|Reports] */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
        <Link to="/dashboard" style={tabStyle(isActive('/dashboard'))} title="Dashboard">
          Dashboard
        </Link>
        <Link to="/timeline" style={tabStyle(isActive('/timeline'))} title="Timeline">
          Timeline
        </Link>
        <Link to="/reports" style={tabStyle(isActive('/reports'))} title="Reports">
          Reports
        </Link>
        <Link to="/alerts" style={tabStyle(isActive('/alerts'))} title="Alerts">
          Alerts
        </Link>
        {featureFlags.chat && (
          <Link to="/chat" style={tabStyle(isActive('/chat'))} title="Chat (beta)">
            Chat
          </Link>
        )}
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
 * VideoModal with playback controls, AI annotations toggle, metadata panel and basic error handling.
 * Header now: "Behavior Video – [Behavior Name] at [Timestamp]" and includes helper guidance.
 */
function VideoModal({ open, onClose }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showAI, setShowAI] = useState(true);
  const [error, setError] = useState('');
  const [camera, setCamera] = useState('Fixed Cam 1'); // Camera: Fixed Cam 1 / PTZ Cam 2
  const playerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      setSpeed(1);
      setError('');
      setCamera('Fixed Cam 1');
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

  const switchCamera = () => {
    setCamera((c) => (c === 'Fixed Cam 1' ? 'PTZ Cam 2' : 'Fixed Cam 1'));
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
        <div style={{ padding: 16, borderBottom: `1px solid ${themeTokens.border}`, display: 'grid', gap: 6, background: 'var(--table-header-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontWeight: 800 }}>
                Behavior Video – Moving at 2025-01-22 14:37:09
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Camera: {camera}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={primaryGhostBtnStyle} onClick={() => setShowAI(v => !v)} title="Toggle AI annotations">
                {showAI ? 'Hide AI' : 'Show AI'}
              </button>
              <button onClick={onClose} style={primaryGhostBtnStyle} title="Close">Close</button>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            Use synchronized playback to validate behavior from different camera perspectives.
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
                <div style={{
                  position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.35)', border: `1px solid ${themeTokens.border}`,
                  color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 12
                }}>
                  {camera}
                </div>
                <button
                  onClick={switchCamera}
                  title="Compare multiple angles side-by-side for better analysis."
                  style={{
                    position: 'absolute', top: 12, right: 12, ...primaryGhostBtnStyle, background: 'rgba(255,255,255,0.85)'
                  }}
                >
                  Switch Camera View
                </button>
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
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={primaryBtnStyle} title="Download Clip">Download Clip</button>
              <button style={primaryGhostBtnStyle} title="Share Timestamp">Share Timestamp</button>
              <button style={primaryGhostBtnStyle} onClick={switchCamera} title="Compare multiple angles side-by-side for better analysis.">Switch Camera View</button>
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
 * Pages
 */

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
      {/* Persistent help widget on unauthenticated page */}
      <AIHelpChat />
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
      {/* Persistent help widget on unauthenticated page */}
      <AIHelpChat />
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
          <button style={primaryGhostBtnStyle} title="Quick Access">Quick Access</button>
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
 * DashboardPage shows Behavior Count, Behavior Duration (pie/stacked bar), and Daily Activity Pattern.
 * Now includes role-based helper texts and a global role tip block.
 */
function DashboardPage() {
  const [openVideo, setOpenVideo] = useState(false);
  const { role } = useAuth();

  // Section descriptions
  const SECTION_TITLES = {
    count: 'Behavior Count',
    duration: 'Behavior Duration Analysis',
    daily: 'Daily Activity Pattern',
  };

  const SECTION_DESCRIPTIONS = {
    count: 'Quick view of occurrences for selected period.',
    duration: 'Time spent in each behavior.',
    daily: 'Visualize activity intensity across 24 hours.',
  };

  // Role-specific helper snippets per section
  const ROLE_HELPERS = {
    keeper: {
      count: 'Identify abnormal spikes quickly.',
      duration: 'Use count and duration charts to spot unusual patterns quickly.', // also appears in global helper
      daily: '',
    },
    researcher: {
      count: '',
      duration: '',
      daily: 'Spot circadian trends for analysis.',
    },
    veterinarian: {
      count: '',
      duration: 'Assess welfare through time budgets.',
      daily: '',
    },
  };

  // Global role-specific helper
  const GLOBAL_ROLE_HELPER = {
    keeper: 'Use count and duration charts to spot unusual patterns quickly.',
    researcher: 'Click any behavior to trace exact video evidence for detailed analysis.',
    veterinarian: 'Generate welfare reports to evaluate health and compliance.',
  };

  // New behavior taxonomy used across the app
  const BEHAVIOR_CATEGORIES = [
    'Recumbent',
    'Non-Recumbent',
    'Scratching',
    'Self-Directed',
    'Pacing',
    'Moving',
  ];

  // Mock dataset replacements to include all six categories
  const [durationMode, setDurationMode] = useState('duration'); // count|duration
  const [pieMode, setPieMode] = useState(true); // stacked/pie toggle (mocked)

  // Mock counts for Behavior Count chart (kept functional but taxonomy-aligned)
  const mockCounts = {
    'Recumbent': 22,
    'Non-Recumbent': 15,
    'Scratching': 7,
    'Self-Directed': 10,
    'Pacing': 5,
    'Moving': 19,
  };
  const totalCount = BEHAVIOR_CATEGORIES.reduce((sum, k) => sum + (mockCounts[k] || 0), 0);

  // Mock durations (minutes) for Behavior Duration chart
  const mockDurations = {
    'Recumbent': 485,       // 8h05m
    'Non-Recumbent': 210,   // 3h30m
    'Scratching': 35,       // 0h35m
    'Self-Directed': 65,    // 1h05m
    'Pacing': 40,           // 0h40m
    'Moving': 205,          // 3h25m
  };

  // Total minutes in the mocked "day"
  const totalDuration = BEHAVIOR_CATEGORIES.reduce((sum, k) => sum + (mockDurations[k] || 0), 0);

  // Helper for tooltip formatting "Name: 8h 45m (34%)"
  const fmtTooltip = (name) => {
    const mins = mockDurations[name] || 0;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const pct = totalDuration > 0 ? Math.round((mins / totalDuration) * 100) : 0;
    return `${name}: ${hh}h ${String(mm).padStart(2, '0')}m (${pct}%)`;
  };

  // Additional helpers for new chart views

  // PUBLIC_INTERFACE
  function formatHhMm(mins) {
    /** Returns "Hh MMm" per spec for tooltips and labels */
    const h = Math.floor((mins || 0) / 60);
    const m = (mins || 0) % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }

  // Color palettes using theme variables for accessible contrast
  const piePalette = [
    themeTokens.primary,
    themeTokens.secondary,
    '#0EA5E9', // sky-500 tint for variation
    '#22C55E', // green-500
    '#F43F5E', // rose-500
    themeTokens.primary600,
  ];
  const barPalette = [
    themeTokens.primary,
    themeTokens.secondary,
    '#10B981', // emerald-500
    '#6366F1', // indigo-500
    '#F59E0B', // amber-500
    themeTokens.primary600,
  ];

  function pieColor(i) {
    return piePalette[i % piePalette.length];
  }
  function barColor(i) {
    return barPalette[i % barPalette.length];
  }

  // Build a CSS conic-gradient string from data proportions for the pie
  // Example output: 'conic-gradient(color1 0 20%, color2 20% 45%, ...)'
  function conicGradientFromData(keys, dataMap, total) {
    let acc = 0;
    const parts = [];
    keys.forEach((k, idx) => {
      const mins = dataMap[k] || 0;
      const frac = total ? mins / total : 0;
      const start = acc * 100;
      const end = (acc + frac) * 100;
      const color = pieColor(idx);
      parts.push(`${color} ${start}% ${end}%`);
      acc += frac;
    });
    // Fallback to primary color when no data
    return parts.length ? `conic-gradient(${parts.join(', ')})` : themeTokens.primary;
  }

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          <ChartBlock title={`${SECTION_TITLES.count} – ${SECTION_DESCRIPTIONS.count}`}>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
              {role === 'keeper' ? ROLE_HELPERS.keeper.count : ''}
            </div>
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

          {/* Behavior Duration section with new taxonomy */}
          <ChartBlock title={`${SECTION_TITLES.duration} – ${SECTION_DESCRIPTIONS.duration}`}>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
              {role === 'veterinarian' ? ROLE_HELPERS.veterinarian.duration : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8, alignItems: 'center' }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>View</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Toggle labels per spec: Count, Duration, Pie, Stacked Bar */}
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
            {/* Helper text near toggles */}
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
              View time spent in each behavior as a Pie chart or Stacked Bar chart.
            </div>

            {durationMode === 'count' ? (
              <EmptyState title="Count mode" description="Showing distribution by event count (mocked)." />
            ) : totalDuration === 0 ? (
              <EmptyState
                title="No behavior duration data available for this period."
                description="Try selecting a different date range or check if data collection is active."
              />
            ) : (
              <>
                {/* Titles per view */}
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  {pieMode ? 'Behavior Duration – Pie View' : 'Behavior Duration – Stacked Bar View'}
                </div>

                {pieMode ? (
                  /* Pie View with clickable segments (legend acts as segments trigger) */
                  <DashboardPie
                    categories={BEHAVIOR_CATEGORIES}
                    durations={mockDurations}
                    total={totalDuration}
                    colorFor={pieColor}
                    fmtTooltip={fmtTooltip}
                  />
                ) : (
                  /* Stacked Bar View */
                  <div role="img" aria-label="Stacked bar chart of behavior duration in hours"
                       style={{ display: 'grid', gap: 8 }}>
                    {/* Axes labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                      <span>Behaviors</span>
                      <span>Time (Hours)</span>
                    </div>

                    {/* One horizontal stacked bar representing cumulative distribution */}
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
                            title={fmtTooltip(b)}
                            aria-label={fmtTooltip(b)}
                          />
                        );
                      })}
                    </div>

                    {/* Legend with exact labels */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {BEHAVIOR_CATEGORIES.map((b, idx) => (
                        <div key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${themeTokens.border}`, padding: '6px 8px', borderRadius: 10, background: 'var(--surface)' }}>
                          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, background: barColor(idx), boxShadow: themeTokens.shadow }} />
                          <span style={{ fontSize: 12, color: themeTokens.text }}>{b}</span>
                        </div>
                      ))}
                    </div>

                    {/* Helper text */}
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      Stacked bar chart shows cumulative time distribution across behaviors.
                    </div>
                  </div>
                )}
              </>
            )}
          </ChartBlock>

          <ChartBlock title={`${SECTION_TITLES.daily} – ${SECTION_DESCRIPTIONS.daily}`}>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
              {role === 'researcher' ? ROLE_HELPERS.researcher.daily : ''}
            </div>
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
        <div className="card" style={{ borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Role Tips</div>
          <div className="muted" style={{ fontSize: 14 }}>
            {GLOBAL_ROLE_HELPER[role] || GLOBAL_ROLE_HELPER.researcher}
          </div>
        </div>
        <div>
          <button style={primaryBtnStyle} onClick={() => setOpenVideo(true)}>Open Video Modal</button>
        </div>
      </div>
      <VideoModal open={openVideo} onClose={() => setOpenVideo(false)} />
    </AuthedLayout>
  );
}

/**
 * PUBLIC_INTERFACE
 * Clickable pie section (legend items act as segments) that navigates to Timeline with behavior filter.
 */
function DashboardPie({ categories, durations, total, colorFor, fmtTooltip }) {
  const navigate = useNavigate();
  const onOpen = (behavior) => {
    // route with behavior + carry current date range as state
    navigate('/timeline', { state: { behaviorFilter: behavior, dateRangeHint: 'from-dashboard' } });
  };

  // Build gradient just as visual; click handled on legend items
  const gradientBg = (() => {
    let acc = 0;
    const parts = [];
    categories.forEach((k, idx) => {
      const mins = durations[k] || 0;
      const frac = total ? mins / total : 0;
      const start = acc * 100;
      const end = (acc + frac) * 100;
      const color = colorFor(idx);
      parts.push(`${color} ${start}% ${end}%`);
      acc += frac;
    });
    return parts.length ? `conic-gradient(${parts.join(', ')})` : themeTokens.primary;
  })();

  return (
    <div role="img" aria-label="Pie chart of behavior duration percentages" style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {categories.map((b, idx) => {
          const color = colorFor(idx);
          return (
            <button
              key={b}
              onClick={() => onOpen(b)}
              title={`${fmtTooltip(b)} — Click to open Timeline`}
              aria-label={`Open Timeline filtered by ${b}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${themeTokens.border}`, padding: '6px 8px', borderRadius: 10, background: 'var(--surface)', cursor: 'pointer' }}
              className="focus-ring"
            >
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: color, boxShadow: themeTokens.shadow }} />
              <span style={{ fontSize: 12, color: themeTokens.text }}>{b}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          width: 240,
          height: 240,
          borderRadius: '50%',
          border: `1px solid ${themeTokens.border}`,
          boxShadow: themeTokens.shadow,
          background: gradientBg,
          margin: '8px auto'
        }}
        title="Pie chart"
      />

      <div style={{ display: 'grid', gap: 4 }}>
        {categories.map((b) => {
          const mins = durations[b] || 0;
          const pct = total ? Math.round((mins / total) * 100) : 0;
          return (
            <div key={b} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
              <span>{b}</span>
              <span title={fmtTooltip(b)}>{`${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m (${pct}%)`}</span>
            </div>
          );
        })}
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
        Click a segment to open Timeline for details.
      </div>
    </div>
  );
}

function ChartBlock({ title, subtitle, children }) {
  return (
    <div className="card" style={{
      borderRadius: 16, padding: 16
    }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
      {subtitle ? <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{subtitle}</div> : null}
      <div>{children}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function TimelinePage() {
  const location = useLocation();
  // View controls (kept for compatibility)
  const [view] = useState('grid');
  const [openVideo, setOpenVideo] = useState(false);

  // Behavior Timeline section state
  const TIME_RANGES = ['1h', '6h', '12h', '24h', 'Day', 'Week'];
  const [activeRange, setActiveRange] = useState('6h');

  // Read behavior filter passed from dashboard
  const initialBehavior = location.state?.behaviorFilter || 'All';

  // Mock "current camera"
  const currentCamera = 'Camera 1';

  // Mock behavior items for cards and table as specified
  const allBehaviorItems = [
    {
      type: 'Recumbent',
      start: '14:12',
      end: '14:28',
      durationMin: 16,
      camera: 'Camera 1',
      confidence: 0.88,
    },
    {
      type: 'Scratching',
      start: '14:31',
      end: '14:33',
      durationMin: 2,
      camera: 'Camera 1',
      confidence: 0.81,
    },
    {
      type: 'Self-Directed',
      start: '14:39',
      end: '14:45',
      durationMin: 6,
      camera: 'Camera 2',
      confidence: 0.93,
    },
    {
      type: 'Pacing',
      start: '14:46',
      end: '14:59',
      durationMin: 13,
      camera: 'Camera 1',
      confidence: 0.76,
    },
    {
      type: 'Moving',
      start: '15:03',
      end: '15:12',
      durationMin: 9,
      camera: 'Camera 1',
      confidence: 0.92,
    },
  ];

  // Filter by behavior if navigated from Dashboard; otherwise include all
  const behaviorItems = allBehaviorItems.filter(it => initialBehavior === 'All' ? true : it.type === initialBehavior);

  const resultCount = behaviorItems.length;

  // Totals and metrics
  const totalMinutes = behaviorItems.reduce((sum, it) => sum + (it.durationMin || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const breakdown = behaviorItems.reduce((acc, it) => {
    if (!acc[it.type]) acc[it.type] = { count: 0, mins: 0 };
    acc[it.type].count += 1;
    acc[it.type].mins += it.durationMin || 0;
    return acc;
  }, {});

  const confidenceValues = behaviorItems.map(b => Math.round(b.confidence * 100));
  const confMin = confidenceValues.length ? Math.min(...confidenceValues) : 0;
  const confMax = confidenceValues.length ? Math.max(...confidenceValues) : 0;

  // Tooltip copy for confidence
  const CONFIDENCE_TOOLTIP = 'Confidence: AI classification accuracy for this behavior.';

  // Helper: render tab button using existing .tab style tokens
  const Tab = ({ label, active, onClick }) => (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`tab${active ? ' active' : ''}`}
      style={{ cursor: 'pointer' }}
      title={`Time range: ${label}`}
    >
      {label}
    </button>
  );

  // Basic camera timeline bar (visual scaffold)
  const CameraTimelineBar = () => (
    <div
      className="card"
      aria-label="Camera timeline"
      title={`Timeline for ${currentCamera}`}
      style={{ padding: 12, borderRadius: 12, display: 'grid', gap: 8 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800 }}>{currentCamera}</div>
        <div className="muted" style={{ fontSize: 12 }}>
          Range: {activeRange}
        </div>
      </div>
      <div
        style={{
          height: 14,
          background: 'var(--table-row-hover)',
          border: `1px solid ${themeTokens.border}`,
          borderRadius: 999,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mock segments showing activity blocks */}
        {behaviorItems.map((b, idx) => {
          // Simple evenly spaced mock positions
          const left = 4 + idx * (92 / behaviorItems.length);
          const width = Math.max(6, 10 - idx); // variable width
          return (
            <div
              key={`${b.type}-${idx}`}
              style={{
                position: 'absolute',
                left: `${left}%`,
                width: `${width}%`,
                top: 1,
                bottom: 1,
                borderRadius: 999,
                background: 'linear-gradient(135deg, rgba(30,138,91,0.6), rgba(52,211,153,0.6))',
                border: `1px solid ${themeTokens.border}`,
              }}
              title={`${b.type}: ${b.start}–${b.end}`}
              aria-label={`${b.type} from ${b.start} to ${b.end}`}
            />
          );
        })}
      </div>
    </div>
  );

  // Card component per new spec
  const TimelineBehaviorCard = ({ item, onPreview }) => {
    const { type, start, end, durationMin, camera, confidence } = item;
    const confidencePct = Math.round(confidence * 100);
    const label = `Behavior – ${start} to ${end} • ${durationMin} min • ${camera} • ${confidencePct}%`;

    return (
      <div className="card" style={{ borderRadius: 14, padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 800 }}>{type}</div>
        <div
          className="muted"
          style={{ fontSize: 12 }}
          aria-label={`Behavior details: ${type} from ${start} to ${end}, ${durationMin} minutes, ${camera}, ${confidencePct} percent confidence`}
        >
          {label}{' '}
          <span
            aria-label="confidence info"
            title={CONFIDENCE_TOOLTIP}
            style={{ textDecoration: 'underline dotted', cursor: 'help' }}
          >
            (i)
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={primaryBtnStyle}
            onClick={onPreview}
            aria-label={`Preview ${type} from ${start} to ${end}`}
            title="Preview the exact video segment"
          >
            Preview
          </button>
          <button style={primaryGhostBtnStyle} title="More details">Details</button>
        </div>
      </div>
    );
  };

  // Behavior Events Table as specified
  const BehaviorEventsTable = () => (
    <div className="card" style={{ borderRadius: 16, padding: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Behavior Events</div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
        Click Preview to watch the exact video segment for this behavior. Use filters to narrow down behaviors by type, duration, or confidence.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table
          role="table"
          aria-label="Behavior Events"
          style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Start</th>
              <th style={thStyle}>End</th>
              <th style={thStyle}>Duration (min)</th>
              <th style={thStyle}>Confidence</th>
              <th style={thStyle}>Camera</th>
              <th style={thStyle} aria-label="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {behaviorItems.map((b, idx) => (
              <tr key={`row-${idx}`} style={{ borderBottom: `1px solid ${themeTokens.border}` }}>
                <td style={tdStyle}>{b.type}</td>
                <td style={tdStyle}>{b.start}</td>
                <td style={tdStyle}>{b.end}</td>
                <td style={tdStyle}>{b.durationMin}</td>
                <td style={tdStyle}>
                  <span title={CONFIDENCE_TOOLTIP} aria-label={`Confidence ${Math.round(b.confidence * 100)} percent`}>
                    {Math.round(b.confidence * 100)}%
                  </span>
                </td>
                <td style={tdStyle}>{b.camera}</td>
                <td style={{ ...tdStyle }}>
                  <button
                    style={primaryGhostBtnStyle}
                    onClick={() => setOpenVideo(true)}
                    aria-label={`Preview ${b.type} video`}
                    title="Preview the exact video segment"
                  >
                    Preview
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Styles for table cells using theme tokens
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

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <FiltersPanel />
        <div style={{ display: 'grid', gap: 12 }}>
          {/* Behavior Timeline section header */}
          <div className="card" style={{ borderRadius: 16, padding: 12, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                Behavior Timeline {initialBehavior !== 'All' ? `• ${initialBehavior}` : ''}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Total duration: <strong>{totalHours} hours</strong>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Confidence range: <strong>{confMin}%–{confMax}%</strong>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }} role="tablist" aria-label="Time ranges">
                {TIME_RANGES.map(r => (
                  <Tab key={r} label={r} active={activeRange === r} onClick={() => setActiveRange(r)} />
                ))}
              </div>
            </div>
            {/* Camera timeline bar */}
            <CameraTimelineBar />
            {/* Activity breakdown */}
            <div className="card" style={{ padding: 12, borderRadius: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Activity Breakdown</div>
              {Object.keys(breakdown).length === 0 ? (
                <EmptyState title="No activity" description="No events match the current filters." />
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {Object.entries(breakdown).map(([name, v]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span>{name}</span>
                      <span>{v.count} events • {Math.floor(v.mins / 60)}h {String(v.mins % 60).padStart(2, '0')}m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cards list per spec, replacing older generic cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr',
              gap: 12,
            }}
          >
            {behaviorItems.map((item, idx) => (
              <TimelineBehaviorCard key={`card-${idx}`} item={item} onPreview={() => setOpenVideo(true)} />
            ))}
          </div>

          {/* Events table */}
          <BehaviorEventsTable />
        </div>
      </div>
      <VideoModal open={openVideo} onClose={() => setOpenVideo(false)} />
    </AuthedLayout>
  );
}

function FiltersPanel() {
  // Consistent behavior set for Timeline filters
  const BEHAVIOR_CATEGORIES = [
    'Recumbent',
    'Non-Recumbent',
    'Scratching',
    'Self-Directed',
    'Pacing',
    'Moving',
  ];
  return (
    <div className="card" style={{
      borderRadius: 16, padding: 16, height: 'fit-content'
    }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Filters</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <div>
          <label style={filterLabel}>Behavior Type</label>
          <select style={selectStyle} aria-label="Behavior Type">
            <option>All</option>
            {BEHAVIOR_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={filterLabel}>Confidence</label>
          <input type="range" min="0" max="100" defaultValue="80" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={filterLabel}>Video Only</label>
          <input type="checkbox" />
        </div>
        <div>
          <label style={filterLabel}>Annotations</label>
          <input type="checkbox" defaultChecked />
        </div>
      </div>
    </div>
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
          {/* Keep badge visual; label can be generic to avoid implying taxonomy mismatch */}
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
 * ReportsPage renders the reports builder and preview. Includes page-level title and helper.
 */
function ReportsPage() {
  const [type, setType] = useState('Behavior Duration Analysis');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [behavior, setBehavior] = useState('All');
  const [hours, setHours] = useState(24);
  const [openExport, setOpenExport] = useState(false);

  const isBehaviorDuration = type === 'Behavior Duration Analysis';
  const BEHAVIOR_CATEGORIES = ['All','Recumbent','Non-Recumbent','Scratching','Self-Directed','Pacing','Moving'];

  const helper = 'Use Behavior, Date Range, and Hours to refine the report. Use Download PDF/Excel to export current view (mock).';

  const downloadMock = (kind) => {
    const content = `VizAI Report (${kind})\nType: ${type}\nBehavior: ${behavior}\nDate Range: ${dateRange}\nHours: ${hours}\nGenerated: ${new Date().toISOString()}\n`;
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
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              {isBehaviorDuration
                ? 'Shows total time spent in each behavior across selected date range.'
                : 'Choose a report type to see its description.'}
            </div>
            <div>
              <label style={filterLabel}>Behavior</label>
              <select value={behavior} onChange={(e) => setBehavior(e.target.value)} style={selectStyle}>
                {BEHAVIOR_CATEGORIES.map(b => <option key={b} value={b}>{b}</option>)}
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
            <div>
              <label style={filterLabel}>Parameters</label>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ color: '#D1D5DB', fontSize: 14 }}><input type="checkbox" defaultChecked /> Include charts</label>
                <label style={{ color: '#D1D5DB', fontSize: 14 }}><input type="checkbox" /> Include raw data</label>
                <label style={{ color: '#D1D5DB', fontSize: 14 }}><input type="checkbox" defaultChecked /> Async email export</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={primaryBtnStyle} onClick={() => downloadMock('PDF')}>Download PDF</button>
              <button type="button" style={primaryGhostBtnStyle} onClick={() => downloadMock('Excel')}>Download Excel</button>
              <button type="button" style={primaryGhostBtnStyle} onClick={() => setOpenExport(true)}>Export (Mock)</button>
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
            description={isBehaviorDuration ? '' : `Type: ${type} • Behavior: ${behavior} • Range: ${dateRange} • Hours: ${hours}`}
          />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <button style={primaryGhostBtnStyle} onClick={() => downloadMock('PDF')}>Download PDF</button>
              <button style={primaryGhostBtnStyle} onClick={() => downloadMock('Excel')}>Download Excel</button>
              <span style={{ flex: 1 }} />
              <button style={primaryGhostBtnStyle} onClick={() => setOpenExport(false)}>Close</button>
              <button style={primaryBtnStyle} onClick={() => setOpenExport(false)}>Okay</button>
            </div>
          </div>
        </div>
      )}
    </AuthedLayout>
  );
}

// PUBLIC_INTERFACE
function AlertsPage() {
  return (
    <AuthedLayout>
      <div className="card" style={{
        padding: 16, display: 'grid', gap: 12
      }}>
        <div style={{ fontWeight: 900 }}>Alerts</div>
        <div style={{
          border: `1px solid ${themeTokens.border}`, borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center'
        }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: themeTokens.secondary, boxShadow: themeTokens.shadow }} />
          <div style={{ fontWeight: 800 }}>Feeding anomaly detected</div>
          <div style={{ color: '#9CA3AF', marginLeft: 'auto' }}>2 hours ago</div>
          <button style={primaryGhostBtnStyle}>View</button>
        </div>
      </div>
    </AuthedLayout>
  );
}

/**
 * PUBLIC_INTERFACE
 * ChatPage renders the AI chat UI (feature-gated by REACT_APP_FEATURE_FLAGS.chat).
 */
function ChatPage() {
  const enabled = !!featureFlags.chat || false; // phase-gated
  return (
    <AuthedLayout>
      {!enabled ? (
        <EmptyState title="AI Chat is coming soon" description="This feature is currently disabled." />
      ) : (
        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: 'calc(100vh - 160px)', gap: 12 }}>
          <div style={{ fontWeight: 900 }}>Welcome to VizAI Chat</div>
          <div className="card" style={{ borderRadius: 16, padding: 16, overflow: 'auto' }}>
            <div className="muted" style={{ marginBottom: 12 }}>Suggested:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <button style={primaryGhostBtnStyle}>Show pacing episodes from yesterday.</button>
              <button style={primaryGhostBtnStyle}>Generate a welfare report.</button>
              <button style={primaryGhostBtnStyle}>Compare activity this week vs last week.</button>
            </div>
            <div style={{ color: 'var(--text)' }}>[ Typing indicator… ]</div>
            <div style={{ marginTop: 12, background: 'var(--table-row-hover)', border: `1px solid ${themeTokens.border}`, borderRadius: 12, padding: 12 }}>
              Sample response with chart, text and references (placeholder).
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Ask a question about behavior…" style={{ ...inputStyle, margin: 0, flex: 1 }} />
            <button style={primaryBtnStyle}>Send</button>
          </div>
        </div>
      )}
    </AuthedLayout>
  );
}

/**
 * Layout wrapper for authenticated pages:
 * includes ConnectionBanner and NavBar
 * PUBLIC_INTERFACE
 * Includes a demo role switcher to preview role-based helper text without backend integration.
 */
function AuthedLayout({ children }) {
  const [connLost, setConnLost] = useState(false);
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [species, setSpecies] = useState('Giant Anteater');
  const showChat = !!featureFlags.chat;
  const alertsCount = 1; // mock badge
  const { role, setRole } = useAuth();
  const location = useLocation();

  // PUBLIC_INTERFACE
  // Breadcrumbs component renders: Home > Giant Anteater > Dashboard
  const Breadcrumbs = () => {
    // Hooks must be at top-level of component
    const navigate = useNavigate();

    // Map route path to label
    const pathToLabel = {
      '/dashboard': 'Dashboard',
      '/timeline': 'Timeline',
      '/reports': 'Reports',
      '/select-animal': 'Dashboard', // When at selection, show "Dashboard" as final crumb? We'll suppress crumb on selection below.
    };

    // Exclude login from breadcrumbs
    const show = location.pathname !== '/login';
    if (!show) return null;

    const currentLabel = pathToLabel[location.pathname] || 'Dashboard';
    const homeHref = '/select-animal';

    // Back handler: go to previous history, fallback to Dashboard
    const onBack = () => {
      if (window.history && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/dashboard');
      }
    };

    // Render crumbs in exact copy: "Home > Giant Anteater > Dashboard"
    const showCrumbs =
      location.pathname === '/dashboard' ||
      location.pathname === '/timeline' ||
      location.pathname === '/reports';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
        {/* Back button with exact copy and a11y */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back to previous screen"
          title="Return to previous page"
          className="focus-ring"
          style={{
            background: 'transparent',
            color: themeTokens.text,
            border: `1px solid ${themeTokens.border}`,
            borderRadius: 10,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>

        {/* Home button routes to Animal Selection */}
        <Link
          to={homeHref}
          title="Go to Animal Selection"
          aria-label="Home"
          style={{
            ...primaryGhostBtnStyle,
            textDecoration: 'none',
            padding: '6px 10px'
          }}
        >
          Home
        </Link>

        {/* Breadcrumb trail */}
        {showCrumbs && (
          <nav
            aria-label="Breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--muted)',
              fontSize: 12,
            }}
          >
            <span>Home</span>
            <span aria-hidden>{'>'}</span>
            <span>Giant Anteater</span>
            <span aria-hidden>{'>'}</span>
            <span aria-current="page" style={{ color: themeTokens.text, fontWeight: 700 }}>
              {currentLabel}
            </span>
          </nav>
        )}
      </div>
    );
  };

  // Sidebar with Species and Date Range per spec
  const Sidebar = () => (
    <aside className="card" style={{ width: 260, padding: 16, borderRadius: 16, height: 'fit-content', position: 'sticky', top: 88 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Filters</div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Select Species</label>
          <select
            aria-label="Select Species"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            style={selectStyle}
            title="Select Species: Giant Anteater ▾"
          >
            <option value="Giant Anteater">Giant Anteater ▾</option>
            <option value="Pangolin" disabled>Pangolin (Coming Soon)</option>
            <option value="Sloth" disabled>Sloth (Coming Soon)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Date Range</label>
          <select
            aria-label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={selectStyle}
            title="Date Range: Last 7 Days ▾"
          >
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom…</option>
          </select>
        </div>
      </div>
    </aside>
  );

  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text }}>
      <ConnectionBanner visible={connLost} />
      <NavBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        showChatTab={showChat}
        species={species}
        setSpecies={setSpecies}
      />
      <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        {/* Breadcrumbs below top nav on relevant pages */}
        <Breadcrumbs />

        {/* Main layout with left sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
          <Sidebar />
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              Use the left panel to change Species or Date Range. Tabs above navigate between Dashboard, Timeline, and Reports.
            </div>
            {children}
            <div style={{ marginTop: 16 }}>
              <button style={primaryGhostBtnStyle} onClick={() => setConnLost(v => !v)}>
                Toggle Connection Banner
              </button>
              <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 12 }}>
                Research tip: behavior vocabulary is consistent across views.
              </span>
              <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 12 }}>
                Alerts: <strong style={{ color: themeTokens.secondary }}>{alertsCount}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Persistent help widget on authed pages */}
      <AIHelpChat />
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

/**
 * PUBLIC_INTERFACE
 * App is the root component. AuthContext now includes:
 * - authed: boolean
 * - setAuthed: function
 * - role: 'keeper' | 'researcher' | 'veterinarian'
 * - setRole: function
 */
function App() {
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState('researcher'); // 'keeper' | 'researcher' | 'veterinarian'

  useEffect(() => {
    // Theme is controlled via CSS variables; no explicit attribute required.
  }, []);

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
          <Route path="/alerts" element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
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
