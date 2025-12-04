import React, { useEffect, useMemo, useState, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import './index.css';
import './App.css';
import { loadUser, saveUser, clearUser } from './authStorage';
// Shared chart helpers and tooltip
import { computePercentage, conicGradient as conicGradientUtil } from './utils/chartUtils';
import Tooltip from './components/Tooltip';
import { FiltersProvider, useFilters } from './context/FiltersContext';
import LeftFilterSidebar from './components/LeftFilterSidebar';
import AnimalProfileCard from './components/AnimalProfileCard';

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
  const { authed, setAuthed, setUser, user } = useAuth();

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
        {/* Display only the user's email; role must remain hidden in UI post-login */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          border: `1px solid ${themeTokens.border}`, borderRadius: 12, background: 'var(--surface)', boxShadow: themeTokens.shadow
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: '#22C55E' }} />
          <span style={{ fontWeight: 700 }}>{user?.email || 'user@viz.ai'}</span>
        </div>
        <button
          onClick={() => {
            clearUser();
            setUser(null);
            setAuthed(false);
            navigate('/login', { replace: true });
          }}
          style={primaryGhostBtnStyle}
          title="Sign out"
          aria-label="Sign out"
        >
          Sign Out
        </button>
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

/* Deprecated: per-page LeftPanelFilters removed in favor of shared LeftFilterSidebar via FiltersContext */

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
    // Persist in context and localStorage (mock). Role is used internally but not shown post-login.
    const u = { email, role };
    setUser(u);
    saveUser(u);
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
    // Use existing stored role if present; otherwise default to Researcher for demo.
    let roleToUse = 'Researcher';
    const stored = loadUser();
    if (stored?.role) roleToUse = stored.role;
    const u = { email, role: roleToUse };
    setUser(u);
    saveUser(u);
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
function useMockSelectedAnimal() {
  // In a future phase, this would read from backend or global context.
  const now = new Date();
  return {
    photo: '/assets/animals/anteater-01.jpg',
    name: 'Zara',
    age: '5y',
    sex: 'F',
    enclosure: 'Savannah - E12',
    status: 'Active',
    lastUpdated: now,
  };
}

function AnimalSelectPage() {
  const [query, setQuery] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);

  // Mock species list with expected availability
  const speciesList = [
    { key: 'anteater', name: 'Giant Anteater', subtitle: 'Myrmecophaga tridactyla', active: true, expected: null, img: '/assets/species/anteater.png' },
    { key: 'pangolin', name: 'Pangolin', subtitle: 'Coming Soon', active: false, expected: 'Expected: Feb 2026', img: '/assets/species/pangolin.png' },
    { key: 'sloth', name: 'Sloth', subtitle: 'Coming Soon', active: false, expected: 'Expected: Sep 2025', img: '/assets/species/sloth.png' },
  ];

  const filtered = speciesList.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

  const EmptySpecies = (
    <EmptyState
      title="No animals available yet. Check back soon or suggest a species."
      description=""
    />
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
      <LeftFilterSidebar />
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
              <button style={primaryBtnStyle} title="Add a species record">
                Add Species
              </button>
              <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(true)} title="Suggest a species">
                Suggest Species
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
          <button style={primaryBtnStyle} title="Add a species record">
            Add Species
          </button>
          <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(true)} title="Suggest a species">
            Suggest Species
          </button>
        </div>
      </div>
      {showSuggest && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
          <div className="card" style={{ width: 420, padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Suggest Species</div>
            <div className="muted" style={{ marginBottom: 10, fontSize: 14 }}>
              Share a species you’d like to see supported. This sends a non-committal suggestion.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Species Name</label>
              <input style={inputStyle} placeholder="e.g., Red Panda" aria-label="Species Name" />
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Why should we add it?</label>
              <textarea style={{ ...inputStyle, minHeight: 96 }} placeholder="Brief rationale…" aria-label="Reason for suggestion" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button style={primaryGhostBtnStyle} onClick={() => setShowSuggest(false)}>Cancel</button>
              <button style={primaryBtnStyle} onClick={() => { alert('Thanks! We will review your suggestion.'); setShowSuggest(false); }}>Submit Suggestion</button>
            </div>
          </div>
        </div>
      )}
    </div>
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
      <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* Inline details preview using AnimalProfileCard for active species */}
      {active ? (
        <div style={{ marginTop: 8 }}>
          <AnimalProfileCard
            photo="/assets/animals/anteater-01.jpg"
            name="Zara"
            age="5y"
            sex="F"
            enclosure="Savannah - E12"
            status="Active"
            lastUpdated={new Date()}
            compact
          />
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
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
  // Always call hooks at top-level inside provider
  const { setBehaviorType, apply } = useFilters();
  const navigate = useNavigate();

  // Local UI state hooks
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
  // conicGradientUtil is used directly in PieWithTooltip for chart backgrounds

  const onPieClick = (label = 'Moving') => {
    setBehaviorType(label);
    // Keep date range unchanged; just ensure apply triggers downstream recompute
    apply();
    navigate(`/timeline?behavior=${encodeURIComponent(label)}`);
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <LeftFilterSidebar />
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Page header aligned to Select Animal tone */}
          <div style={{ display: 'grid', gap: 8, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 900, fontSize: 20, flex: '0 0 auto' }}>Overview — Behavior Insights</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  style={primaryGhostBtnStyle}
                  title="Helpful tips"
                  aria-label="Show dashboard tips"
                >
                  Tips
                </button>
              </div>
            </div>
            {/* Selected animal status */}
            <AnimalProfileCard
              {...(function(){
                const now = new Date();
                return {
                  photo: '/assets/animals/anteater-01.jpg',
                  name: 'Zara',
                  age: '5y',
                  sex: 'F',
                  enclosure: 'Savannah - E12',
                  status: 'Active',
                  lastUpdated: now,
                }
              })()}
              compact
            />
          </div>

          {/* Helper microcopy bar mirroring Select Animal helper tone */}
          <div className="card" style={{ padding: 12, borderRadius: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              Tip: Click any legend item to jump to Timeline with that behavior pre-filtered.
            </div>
          </div>

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
                      <div
                        role="button"
                        onClick={() => navigate(`/timeline?behavior=${encodeURIComponent(b)}`)}
                        title={`Open Timeline filtered by ${b}`}
                        style={{
                          height: 10, background: 'var(--table-row-hover)', border: `1px solid ${themeTokens.border}`, borderRadius: 999, overflow: 'hidden', cursor: 'pointer'
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
                    {pieMode ? 'Behavior Duration — Pie View' : 'Behavior Duration — Stacked Bar View'}
                  </div>

                  {pieMode ? (
                    <PieWithTooltip
                      categories={BEHAVIOR_CATEGORIES}
                      dataMap={mockDurations}
                      total={totalDuration}
                      colorResolver={pieColor}
                      onSliceClick={(label) => onPieClick(label)}
                      formatLabel={(label, pct) => `${label} — ${pct}%`}
                    />
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
                        aria-label="Cumulative time distribution across behaviors"
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
        </div>

        {/* Action area with consistent tone */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={primaryBtnStyle} onClick={() => setOpenVideo(true)} title="Open video preview">
            Open Video Modal
          </button>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            You can continue exploring while previews are open.
          </span>
        </div>
      </div>
      <VideoModal open={openVideo} onClose={() => setOpenVideo(false)} />
    </>
  );
}

function ChartBlock({ title, children }) {
  return (
    <div className="card" style={{ borderRadius: 16, padding: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * PieWithTooltip renders a conic-gradient pie with a hover tooltip that shows "<label> — <percentage>%".
 * - It detects the hovered slice using cursor angle relative to the circle center.
 * - Uses Neon Fun styling via Tooltip component.
 */
function PieWithTooltip({ categories, dataMap, total, colorResolver, onSliceClick, formatLabel }) {
  const wrapperRef = useRef(null);
  const [hover, setHover] = useState({ show: false, x: 0, y: 0, label: '', pct: '' });

  // Precompute cumulative ranges for angle mapping [0..1)
  const ranges = React.useMemo(() => {
    const sum = total || categories.reduce((s, k) => s + (dataMap[k] || 0), 0);
    let acc = 0;
    const arr = categories.map((k, idx) => {
      const v = Number(dataMap[k] || 0);
      const frac = sum ? v / sum : 0;
      const start = acc;
      const end = acc + frac;
      acc = end;
      return { key: k, start, end, color: colorResolver(idx), value: v, frac };
    });
    return { slices: arr, sum };
  }, [categories, dataMap, total, colorResolver]);

  const onMove = (e) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = e.clientX - cx;
    const y = e.clientY - cy;
    const r = Math.sqrt(x * x + y * y);
    const radius = rect.width / 2;

    const within = r <= radius + 8 && r >= 0; // allow slight tolerance
    if (!within || !ranges.sum) {
      setHover(h => ({ ...h, show: false }));
      return;
    }

    // Compute angle [0..1). Math.atan2 gives radians from -PI..PI (x-axis), we rotate so 0 is at top.
    let angle = Math.atan2(y, x); // radians
    // Convert to [0..2PI)
    if (angle < 0) angle += Math.PI * 2;
    // Rotate so 0 at top (negative y axis), clockwise
    let norm = (angle - Math.PI / 2);
    if (norm < 0) norm += Math.PI * 2;
    const fracAngle = norm / (Math.PI * 2); // 0..1

    const hit = ranges.slices.find(s => fracAngle >= s.start && fracAngle < s.end) || ranges.slices[ranges.slices.length - 1];
    if (!hit) {
      setHover(h => ({ ...h, show: false }));
      return;
    }

    const pct = computePercentage(hit.value, ranges.sum, 1);
    setHover({
      show: true,
      x: e.clientX,
      y: e.clientY,
      label: hit.key,
      pct
    });
  };

  const onLeave = () => setHover(h => ({ ...h, show: false }));

  return (
    <div role="img" aria-label="Pie chart of behavior duration percentages" style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {categories.map((b, idx) => {
          const mins = dataMap[b] || 0;
          const pctStr = computePercentage(mins, total, 1);
          const color = colorResolver(idx);
          return (
            <button key={b}
              onClick={() => onSliceClick?.(b)}
              title={`${b}: ${pctStr}% • Click to view in Timeline`}
              aria-label={`Filter timeline by ${b}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid var(--border)`, padding: '6px 8px', borderRadius: 10, background: 'var(--surface)', cursor: 'pointer' }}>
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: color, boxShadow: 'var(--shadow)' }} />
              <span style={{ fontSize: 12 }}>{b}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={wrapperRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={() => onSliceClick?.(hover.label || categories[0])}
        style={{
          width: 240,
          height: 240,
          borderRadius: '50%',
          border: `1px solid ${themeTokens.border}`,
          boxShadow: themeTokens.shadow,
          background: conicGradientUtil(categories, dataMap, total, (i) => colorResolver(i)),
          margin: '8px auto',
          cursor: 'pointer'
        }}
        title="Pie chart (hover to see details, click to open Timeline with filter)"
        aria-describedby="chart-tooltip"
        aria-label="Pie chart: hover to see behavior and percentage"
      />
      <Tooltip
        visible={hover.show}
        x={hover.x}
        y={hover.y}
        label={hover.label}
        detail={`${hover.pct}%`}
      />
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
  const { behaviorType, setBehaviorType, applyVersion } = useFilters();

  // Honor incoming query pre-filter
  useEffect(() => {
    const incoming = searchParams.get('behavior');
    if (incoming) {
      setBehaviorType(incoming);
    }
  }, [searchParams, setBehaviorType]);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <LeftFilterSidebar />
        <TimelineContent
          view={view}
          setView={setView}
          zoom={zoom}
          setZoom={setZoom}
          count={count}
          setCount={setCount}
          openVideo={openVideo}
          setOpenVideo={setOpenVideo}
          behaviorFilter={behaviorType || 'All'}
          applyVersion={applyVersion}
        />
      </div>
    </>
  );
}

function TimelineContent({ view, setView, zoom, setZoom, count, setCount, openVideo, setOpenVideo, behaviorFilter, applyVersion }) {
  const { species, dateRange } = useAuth();

  // Mock behavior segments and events; in future, fetch using species/dateRange/behaviorFilter
  const mockSegments = React.useMemo(() => {
    // Build a mock 2-hour window starting now - 2h to now, with segments
    const end = new Date();
    const start = new Date(end.getTime() - 2 * 60 * 60 * 1000);
    const behaviors = [
      { label: 'Moving', start: new Date(start.getTime() + 5 * 60 * 1000), end: new Date(start.getTime() + 18 * 60 * 1000), metrics: { confidence: 0.91 } },
      { label: 'Scratching', start: new Date(start.getTime() + 22 * 60 * 1000), end: new Date(start.getTime() + 28 * 60 * 1000), metrics: { intensity: 'low' } },
      { label: 'Recumbent', start: new Date(start.getTime() + 30 * 60 * 1000), end: new Date(start.getTime() + 75 * 60 * 1000), metrics: {} },
      { label: 'Non-Recumbent', start: new Date(start.getTime() + 80 * 60 * 1000), end: new Date(start.getTime() + 95 * 60 * 1000), metrics: {} },
      { label: 'Moving', start: new Date(start.getTime() + 100 * 60 * 1000), end: new Date(start.getTime() + 116 * 60 * 1000), metrics: { speed: '1.2 m/s' } },
      { label: 'Pacing', start: new Date(start.getTime() + 118 * 60 * 1000), end: new Date(start.getTime() + 120 * 60 * 1000), metrics: { loops: 3 } },
    ];
    return { range: { start, end }, items: behaviors };
  }, []);

  const filteredSegments = React.useMemo(() => {
    if (behaviorFilter === 'All') return mockSegments;
    return {
      range: mockSegments.range,
      items: mockSegments.items.filter(s => s.label === behaviorFilter)
    };
  }, [mockSegments, behaviorFilter]);

  const mockEvents = React.useMemo(() => {
    // Derive events at segment starts for demo
    return mockSegments.items.map((seg, idx) => ({
      id: idx + 1,
      ts: seg.start,
      label: seg.label,
      metrics: seg.metrics || {}
    }));
  }, [mockSegments]);

  const filteredEvents = React.useMemo(() => {
    if (behaviorFilter === 'All') return mockEvents;
    return mockEvents.filter(e => e.label === behaviorFilter);
  }, [mockEvents, behaviorFilter]);

  useEffect(() => {
    // mock re-count when behavior changes
    setCount(filteredEvents.length);
  }, [behaviorFilter, filteredEvents, setCount]);

  return (
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Header aligned to Select Animal style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900, fontSize: 20, flex: '0 0 auto' }}>Behavior Explorer</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {count} results
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={controlBtnStyle} onClick={() => setZoom(z => Math.max(25, z - 25))} title="Zoom out" aria-label="Zoom out">-</button>
            <div style={{ minWidth: 48, textAlign: 'center' }} aria-live="polite">{zoom}%</div>
            <button style={controlBtnStyle} onClick={() => setZoom(z => Math.min(200, z + 25))} title="Zoom in" aria-label="Zoom in">+</button>
            <button
              style={{ ...primaryGhostBtnStyle, background: view === 'grid' ? 'rgba(52,211,153,0.12)' : 'transparent' }}
              onClick={() => setView('grid')}
              title="Grid view"
              aria-pressed={view === 'grid'}
            >
              Grid
            </button>
            <button
              style={{ ...primaryGhostBtnStyle, background: view === 'list' ? 'rgba(52,211,153,0.12)' : 'transparent' }}
              onClick={() => setView('list')}
              title="List view"
              aria-pressed={view === 'list'}
            >
              List
            </button>
          </div>
        </div>

        {/* Helper microcopy bar mirroring Select Animal tip card */}
        <div className="card" style={{ padding: 12, borderRadius: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
            Tip: Hover the timeline to see behavior durations. Open any event to preview video.
          </div>
        </div>

        {/* Behavior Timeline visualization */}
        <BehaviorTimeline
          range={filteredSegments.range}
          items={filteredSegments.items}
          zoom={zoom}
          species={species}
          dateRange={dateRange}
          behaviorFilter={behaviorFilter}
        />

        {/* Events list */}
        <BehaviorEventsList
          events={filteredEvents}
          onOpenVideo={() => setOpenVideo(true)}
        />

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



/**
 * PUBLIC_INTERFACE
 * BehaviorTimeline: horizontal time axis with behavior segments.
 * - Accepts range {start, end} and items [{label,start,end,metrics}]
 * - Computes durations and renders segments with Neon Fun accents.
 * - Hover tooltips show label, duration hh:mm:ss, and available metrics.
 */
function BehaviorTimeline({ range, items, zoom = 100, species, dateRange, behaviorFilter }) {
  const [hover, setHover] = useState(null);
  const containerRef = useRef(null);

  // Helpers
  function fmtHMS(ms) {
    const tot = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(tot / 3600);
    const m = Math.floor((tot % 3600) / 60);
    const s = tot % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function labelColor(label) {
    const idx = Math.max(0, BEHAVIOR_CATEGORIES.indexOf(label));
    const palette = [
      '#10B981', '#F59E0B', '#0EA5E9', '#6366F1', '#F43F5E', '#14B8A6'
    ];
    return palette[idx % palette.length];
  }

  if (!range || !range.start || !range.end) {
    return <EmptyState title="No timeline data" description="Try adjusting filters or date range." />;
  }

  const totalMs = Math.max(1, (range.end.getTime() - range.start.getTime()));
  const zoomScale = Math.max(0.5, Math.min(2, zoom / 100));
  const hourCount = Math.ceil(totalMs / (60 * 60 * 1000));

  const onEnter = (e, seg) => {
    // const rect = containerRef.current?.getBoundingClientRect();
    setHover({
      x: e.clientX,
      y: e.clientY,
      seg
    });
  };
  const onMove = (e) => {
    if (!hover) return;
    setHover(h => ({ ...h, x: e.clientX, y: e.clientY }));
  };
  const onLeave = () => setHover(null);

  const axisColor = '#374151'; // readable text per theme
  const subtleBg = 'rgba(55,65,81,0.06)';

  return (
    <div className="card" style={{ borderRadius: 16, padding: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Behavior Timeline</div>
      <div
        ref={containerRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          position: 'relative',
          border: `1px solid ${themeTokens.border}`,
          borderRadius: 12,
          background: subtleBg,
          padding: 12,
          overflowX: 'auto'
        }}
        role="region"
        aria-label="Behavior timeline with time axis"
      >
        {/* Axis */}
        <div style={{ position: 'relative', height: 40, marginBottom: 8 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 20, height: 2, background: axisColor, opacity: 0.2 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex' }}>
            {Array.from({ length: Math.max(2, hourCount + 1) }).map((_, i) => {
              const t = new Date(range.start.getTime() + i * 60 * 60 * 1000);
              const label = `${String(t.getHours()).padStart(2,'0')}:00`;
              return (
                <div key={i} style={{ minWidth: 160 * zoomScale, textAlign: 'left', color: axisColor, fontSize: 12 }}>
                  | {label}
                </div>
              );
            })}
          </div>
        </div>
        {/* Segments */}
        <div style={{ position: 'relative', height: 36 }}>
          {items.map((seg, idx) => {
            const startFrac = (seg.start.getTime() - range.start.getTime()) / totalMs;
            const endFrac = (seg.end.getTime() - range.start.getTime()) / totalMs;
            const leftPx = Math.max(0, startFrac * hourCount * 160 * zoomScale);
            const widthPx = Math.max(3, (endFrac - startFrac) * hourCount * 160 * zoomScale);
            const color = labelColor(seg.label);
            const durationMs = seg.end.getTime() - seg.start.getTime();
            return (
              <div
                key={idx}
                onMouseEnter={(e) => onEnter(e, seg)}
                title={`${seg.label} — ${fmtHMS(durationMs)}`}
                style={{
                  position: 'absolute',
                  left: leftPx,
                  top: 6,
                  height: 24,
                  width: widthPx,
                  borderRadius: 8,
                  background: color,
                  boxShadow: themeTokens.shadow,
                  border: `1px solid ${themeTokens.border}`,
                  cursor: 'default'
                }}
                aria-label={`${seg.label} from ${seg.start.toLocaleTimeString()} to ${seg.end.toLocaleTimeString()}`}
              />
            );
          })}
        </div>
        {/* Tooltip */}
        <Tooltip
          visible={Boolean(hover)}
          x={hover?.x || 0}
          y={hover?.y || 0}
          label={hover?.seg?.label || ''}
          detail={
            hover?.seg
              ? (() => {
                  const dms = hover.seg.end.getTime() - hover.seg.start.getTime();
                  const dur = (function(ms){ const s=Math.floor(ms/1000); const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); const ss=s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`; })(dms);
                  const metrics = hover.seg.metrics || {};
                  const metStr = Object.keys(metrics).length ? ` • ${Object.entries(metrics).map(([k,v])=>`${k}: ${v}`).join(', ')}` : '';
                  return `Duration: ${dur}${metStr}`;
                })()
              : ''
          }
        />
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Showing species: <b>{species}</b>, Date Range: <b>{dateRange}</b>{' '}
        {behaviorFilter && behaviorFilter !== 'All' ? <>• Behavior: <b>{behaviorFilter}</b></> : null}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * BehaviorEventsList: scrollable list of events with badges and metadata.
 * - Accepts events [{id, ts, label, metrics}]
 * - Renders readable timestamp, behavior badge, and optional metrics chips.
 */
function BehaviorEventsList({ events, onOpenVideo }) {
  const TEXT = '#374151';
  const BG = 'rgba(55,65,81,0.04)';
  const PRIMARY = '#10B981';

  function formatTS(d) {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  }
  function formatDur(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }

  if (!events || events.length === 0) {
    return (
      <div className="card" style={{ borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Behavior Events</div>
        <EmptyState title="No behavior events in this period." description="Try expanding your date range or clearing filters." />
      </div>
    );
  }

  return (
    <div className="card" style={{ borderRadius: 16, padding: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Behavior Events</div>
      <div style={{
        maxHeight: 280,
        overflowY: 'auto',
        border: `1px solid ${themeTokens.border}`,
        borderRadius: 12,
        background: BG
      }}>
        {events.map((e, i) => {
          const ts = e.ts instanceof Date ? e.ts : new Date(e.ts);
          const timeStr = formatTS(ts);
          const metricsEntries = Object.entries(e.metrics || {});
          // mock duration: 60-300s
          const durMs = (e.durationMs != null) ? e.durationMs : (60 + ((i * 37) % 240)) * 1000;
          const camera = e.camera || `Camera ${1 + (i % 3)}`;
          const icon = e.label?.[0] || 'B';

          return (
            <div key={e.id || i} style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 10,
              alignItems: 'center',
              padding: '10px 12px',
              borderBottom: i === events.length - 1 ? 'none' : `1px solid ${themeTokens.border}`,
              background: 'var(--surface)'
            }}>
              {/* Icon */}
              <div title={e.label} aria-hidden style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(16,185,129,0.12)', color: PRIMARY,
                display: 'grid', placeItems: 'center', fontWeight: 800, border: `1px solid ${themeTokens.border}`
              }}>
                {icon}
              </div>
              {/* Main */}
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: PRIMARY }}>
                    {e.label}
                  </span>
                  <span className="badge" style={{ background: 'rgba(55,65,81,0.10)', color: TEXT }}>
                    {timeStr}
                  </span>
                  <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }} title="Duration">
                    {formatDur(durMs)}
                  </span>
                  <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#2563EB' }} title="Camera Source">
                    {camera}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* mock video thumbnail */}
                  <div aria-hidden title="Video thumbnail (mock)" style={{
                    width: 120, height: 60, borderRadius: 8, background: 'linear-gradient(135deg, rgba(30,138,91,0.12), rgba(245,158,11,0.12))',
                    border: `1px solid ${themeTokens.border}`, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 12
                  }}>
                    Thumbnail
                  </div>
                  {/* metadata chips */}
                  {metricsEntries.length === 0 ? (
                    <span className="badge" style={{ background: 'rgba(55,65,81,0.10)', color: TEXT }}>
                      Confidence: —
                    </span>
                  ) : metricsEntries.map(([k, v]) => (
                    <span key={k} className="badge" style={{ background: 'rgba(55,65,81,0.10)', color: TEXT }}>
                      {k}: {String(v)}
                    </span>
                  ))}
                  <span className="badge" style={{ background: 'rgba(107,114,128,0.12)', color: '#6B7280' }}>
                    Environment: —
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'grid', gap: 8 }}>
                <button style={primaryGhostBtnStyle} onClick={onOpenVideo} title="Preview video">View Video</button>
                <button style={primaryGhostBtnStyle} title="Open details">Open</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * ReportsPage with Behavior dropdown, date range, hours filters, and mock PDF/Excel download actions
 */
function ReportsPage() {
  const { species } = useAuth();
  const { behaviorType, dateRange, hoursRange } = useFilters();
  const [type, setType] = useState('Behavior Duration Analysis');
  const [openExport, setOpenExport] = useState(false);
  const [downloading, setDownloading] = useState('');

  const isBehaviorDuration = type === 'Behavior Duration Analysis';

  const triggerDownload = async (fmt) => {
    setDownloading(fmt);
    // mock async
    await new Promise(r => setTimeout(r, 700));
    const start = dateRange?.start ? new Date(dateRange.start).toDateString() : '—';
    const end = dateRange?.end ? new Date(dateRange.end).toDateString() : '—';
    const hrs = `${hoursRange?.min ?? '—'} - ${hoursRange?.max ?? '—'}`;
    alert(`Mock ${fmt.toUpperCase()} export queued.\nType: ${type}\nSpecies: ${species}\nBehavior: ${Array.isArray(behaviorType) ? behaviorType.join(', ') : behaviorType}\nDate Range: ${start} → ${end}\nHours: ${hrs}`);
    setDownloading('');
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <LeftFilterSidebar />
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
            {(() => {
              const start = dateRange?.start ? new Date(dateRange.start).toDateString() : '—';
              const end = dateRange?.end ? new Date(dateRange.end).toDateString() : '—';
              const hrs = `${hoursRange?.min ?? '—'} - ${hoursRange?.max ?? '—'}`;
              const bhv = Array.isArray(behaviorType) ? behaviorType.join(', ') : behaviorType || 'All';
              return (
                <>
                  Filters applied — Species: <b>{species}</b>, Behavior: <b>{bhv}</b>, Date Range: <b>{start} → {end}</b>, Hours: <b>{hrs}</b>
                </>
              );
            })()}
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
              Your report "{type}" for the selected period is being generated. We will notify you when it’s ready.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={primaryGhostBtnStyle} onClick={() => setOpenExport(false)}>Close</button>
              <button style={primaryBtnStyle} onClick={() => setOpenExport(false)}>Okay</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



/**
 * Layout wrapper for authenticated pages:
 * includes ConnectionBanner and NavBar
 * Adds left panel layout option and stores species/date in auth context for app-wide usage.
 */

function AuthedLayout() {
  /**
   * FiltersProvider is applied once at the routes level; do not re-wrap here.
   * Connection status banner has been removed per request.
   */
  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text }}>
      <NavBar />
      <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span title="Project status" style={{ fontSize: 12, color: 'var(--muted)' }}>
            Environment: {process.env.REACT_APP_NODE_ENV || 'development'} • API: {process.env.REACT_APP_API_BASE || 'mock'}
          </span>
        </div>
        <Outlet />
        <div style={{ marginTop: 16 }}>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
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
function ProtectedRoute({ children, requiredRoles }) {
  const { authed, user } = useAuth();
  if (!authed) return <Navigate to="/login" replace />;
  // Role is used ONLY for internal authorization checks; never render role in UI post-login
  if (requiredRoles && requiredRoles.length > 0) {
    const ok = user?.role && requiredRoles.includes(user.role);
    if (!ok) {
      // Navigate to a safe default; keep UX friendly
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
}

// PUBLIC_INTERFACE
function App() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null); // { email, role }
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [species, setSpecies] = useState('Giant Anteater');

  useEffect(() => {
    // Attempt to restore prior session
    const existing = loadUser();
    if (existing?.email) {
      setUser(existing);
      setAuthed(true);
    }
    // Theme is controlled via CSS variables; no explicit attribute required.
  }, []);

  const authValue = useMemo(() => ({
    authed, setAuthed,
    user, setUser,
    dateRange, setDateRange,
    species, setSpecies
  }), [authed, user, dateRange, species]);

  return (
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route
            element={
              <ProtectedRoute>
                <FiltersProvider>
                  <AuthedLayout />
                </FiltersProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="select-animal" element={<AnimalSelectPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredRoles={['Researcher','Field Observer','Admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
