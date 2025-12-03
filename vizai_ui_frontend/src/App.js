import React, { useEffect, useMemo, useState, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
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
 * AuthContext simulates signed-in state for route guarding
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
   * Brand logo + text (single instance).
   * Ensures:
   * - Explicit 32x32 icon sizing
   * - Inline-flex alignment for vertical centering
   * - 8px spacing between logo and text
   * - No opacity/filter that could hide the logo
   * - Single bold "VizAI" in brand color
   * - ARIA labels and tooltip for accessibility
   */
  const iconSize = 32; // 32x32 per requirement
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--brand-gap, 8px)',
        fontWeight: 900,
        lineHeight: 1,
        color: 'var(--text)',
      }}
      aria-label="VizAI brand"
    >
      <img
        src="/assets/vizai-logo.png"
        width={iconSize}
        height={iconSize}
        alt="VizAI Logo"
        title="Go to VizAI home"
        aria-hidden={false}
        style={{
          display: 'block',
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          objectFit: 'contain',
          filter: 'none',
          opacity: 1,
          visibility: 'visible',
        }}
      />
      <span
        title="VizAI"
        style={{
          color: 'var(--primary)',
          fontSize: 'var(--brand-text-size)',
          letterSpacing: 0.25,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          fontWeight: 900,
        }}
      >
        VizAI
      </span>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * NavBar with logo, species dropdown, tabs, date selector, user menu
 */
function NavBar({ dateRange, setDateRange, showChatTab, species, setSpecies }) {
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
    // Navigate to Animal Selection if unauthenticated, otherwise Dashboard
    if (!authed) {
      navigate('/select-animal');
      return;
    }
    navigate('/dashboard');
  };

  // Alert badge (mock) for Alerts tab
  const alertsBadge = (
    <span aria-label="notifications" style={{
      position: 'absolute', top: -4, right: -4,
      width: 18, height: 18, borderRadius: 999,
      background: themeTokens.secondary, color: 'var(--surface)',
      fontSize: 11, fontWeight: 900,
      display: 'grid', placeItems: 'center',
      boxShadow: themeTokens.shadow
    }}>1</span>
  );

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
        </button>
        <div style={{ height: 24, width: 1, background: themeTokens.border }} />
        <label style={{ color: 'var(--muted)', fontSize: 12 }} title="Choose species to filter views">Species</label>
        <select
          aria-label="Species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          style={{
            background: 'var(--surface)',
            color: themeTokens.text,
            border: `1px solid ${themeTokens.border}`,
            borderRadius: 12,
            padding: '8px 12px',
            fontWeight: 700,
            boxShadow: themeTokens.shadow
          }}
        >
          <option value="Giant Anteater">Giant Anteater</option>
          <option value="Pangolin" disabled>pangolin (Coming Soon)</option>
          <option value="Sloth" disabled>sloth (Coming Soon)</option>
        </select>

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
          <span style={{ position: 'relative' }}>
            <Link to="/alerts" style={tabStyle(isActive('/alerts'))} title="Alerts Center">
              Alerts
            </Link>
            {alertsBadge}
          </span>
          <Link
            to={showChatTab ? '/chat' : '/dashboard'}
            style={{ ...tabStyle(isActive('/chat')), opacity: showChatTab ? 1 : 0.5, cursor: showChatTab ? 'pointer' : 'not-allowed' }}
            aria-disabled={!showChatTab}
            title={showChatTab ? 'AI Chat (beta)' : 'AI Chat (disabled)'}
          >
            Chat
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status="Active" />
          <div title="Keyboard: ? for tips" style={{
            padding: '6px 10px', borderRadius: 999, border: `1px dashed ${themeTokens.border}`, color: 'var(--muted)', fontSize: 12
          }}>Tips: Press ?</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          border: `1px solid ${themeTokens.border}`, borderRadius: 12, background: 'var(--surface)', boxShadow: themeTokens.shadow
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: '#22C55E' }} />
          <span style={{ fontWeight: 700 }}>researcher@viz.ai</span>
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
 * Pages
 */

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
        <div style={{ marginTop: 12, color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
          By continuing you agree to our research-friendly terms.
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

// PUBLIC_INTERFACE
function DashboardPage() {
  const [openVideo, setOpenVideo] = useState(false);

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

  // Helper for tooltip formatting "Name: 8h 45m (34% of day)"
  const fmtTooltip = (name) => {
    const mins = mockDurations[name] || 0;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const pct = totalDuration > 0 ? Math.round((mins / totalDuration) * 100) : 0;
    return `${name}: ${hh}h ${String(mm).padStart(2, '0')}m (${pct}% of day)`;
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

          {/* Behavior Duration section with new taxonomy */}
          <ChartBlock title="Behavior Duration">
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
              Switch between Pie and Stacked Bar to visualize behavior duration as percentages or cumulative time.
            </div>

            {durationMode === 'count' ? (
              <EmptyState title="Count mode" description="Showing distribution by event count (mocked)." />
            ) : totalDuration === 0 ? (
              <EmptyState title="No behavior duration data available for this period." description="" />
            ) : (
              <>
                {/* Titles per view */}
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  {pieMode ? 'Behavior Duration – Pie View' : 'Behavior Duration – Stacked Bar View'}
                </div>

                {pieMode ? (
                  /* Pie View (mocked, accessible, using CSS with theme vars) */
                  <div role="img" aria-label="Pie chart of behavior duration percentages"
                       style={{ display: 'grid', gap: 8 }}>
                    {/* Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {BEHAVIOR_CATEGORIES.map((b, idx) => {
                        const mins = mockDurations[b] || 0;
                        const pct = totalDuration ? Math.round((mins / totalDuration) * 100) : 0;
                        const color = pieColor(idx);
                        return (
                          <div key={b} title={`${b}: ${formatHhMm(mins)} (${pct}%)`}
                               style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${themeTokens.border}`, padding: '6px 8px', borderRadius: 10, background: 'var(--surface)' }}>
                            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: color, boxShadow: themeTokens.shadow }} />
                            <span style={{ fontSize: 12, color: themeTokens.text }}>{b}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Simple "pie" representation using a conic gradient */}
                    <div
                      style={{
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        border: `1px solid ${themeTokens.border}`,
                        boxShadow: themeTokens.shadow,
                        background: conicGradientFromData(BEHAVIOR_CATEGORIES, mockDurations, totalDuration),
                        margin: '8px auto'
                      }}
                      title="Pie chart"
                    />

                    {/* Accessible textual breakdown with tooltips exactly formatted */}
                    <div style={{ display: 'grid', gap: 4 }}>
                      {BEHAVIOR_CATEGORIES.map((b) => {
                        const mins = mockDurations[b] || 0;
                        const pct = totalDuration ? Math.round((mins / totalDuration) * 100) : 0;
                        return (
                          <div key={b} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
                            <span>{b}</span>
                            <span title={`${b}: ${formatHhMm(mins)} (${pct}%)`}>{`${formatHhMm(mins)} (${pct}%)`}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Helper text */}
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                      Pie chart shows percentage of total time spent in each behavior.
                    </div>
                  </div>
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
                            title={`${b}: ${formatHhMm(mins)}`}
                            aria-label={`${b}: ${formatHhMm(mins)}`}
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

// PUBLIC_INTERFACE
function TimelinePage() {
  const [view, setView] = useState('grid');
  const [zoom, setZoom] = useState(100);
  const [count] = useState(12);
  const [openVideo, setOpenVideo] = useState(false);
  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <FiltersPanel />
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

// PUBLIC_INTERFACE
function ReportsPage() {
  const [type, setType] = useState('Behavior Duration Analysis');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [openExport, setOpenExport] = useState(false);

  const isBehaviorDuration = type === 'Behavior Duration Analysis';

  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
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
              <label style={filterLabel}>Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={selectStyle}>
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom…</option>
              </select>
            </div>
            <div>
              <label style={filterLabel}>Parameters</label>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ color: '#D1D5DB', fontSize: 14 }}><input type="checkbox" defaultChecked /> Include charts</label>
                <label style={{ color: '#D1D5DB', fontSize: 14 }}><input type="checkbox" /> Include raw data</label>
                <label style={{ color: '#D1D5DB', fontSize: 14 }}><input type="checkbox" defaultChecked /> Async email export</label>
              </div>
            </div>
            <button style={primaryBtnStyle} onClick={() => setOpenExport(true)}>Export</button>
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

// PUBLIC_INTERFACE
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
              <button style={primaryGhostBtnStyle}>Show feeding trends</button>
              <button style={primaryGhostBtnStyle}>Compare active vs resting</button>
              <button style={primaryGhostBtnStyle}>Explain daily pattern</button>
            </div>
            <div style={{ color: 'var(--text)' }}>[ Typing indicator… ]</div>
            <div style={{ marginTop: 12, background: 'var(--table-row-hover)', border: `1px solid ${themeTokens.border}`, borderRadius: 12, padding: 12 }}>
              Sample response with chart, text and references (placeholder).
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Ask about behaviors, trends, anomalies…" style={{ ...inputStyle, margin: 0, flex: 1 }} />
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
 */
function AuthedLayout({ children }) {
  const [connLost, setConnLost] = useState(false);
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [species, setSpecies] = useState('Giant Anteater');
  const showChat = !!featureFlags.chat;
  const alertsCount = 1; // mock badge

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span title="Project status" style={{ fontSize: 12, color: 'var(--muted)' }}>
            Environment: {process.env.REACT_APP_NODE_ENV || 'development'} • API: {process.env.REACT_APP_API_BASE || 'mock'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            Alerts: <strong style={{ color: themeTokens.secondary }}>{alertsCount}</strong>
          </span>
        </div>
        {children}
        <div style={{ marginTop: 16 }}>
          <button style={primaryGhostBtnStyle} onClick={() => setConnLost(v => !v)}>
            Toggle Connection Banner
          </button>
          <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 12 }}>
            Research tip: behavior vocabulary is consistent across views.
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

  useEffect(() => {
    // Theme is controlled via CSS variables; no explicit attribute required.
  }, []);

  const authValue = useMemo(() => ({ authed, setAuthed }), [authed]);

  return (
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>
        <Routes>
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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
