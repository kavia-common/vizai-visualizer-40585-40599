import React, { useEffect, useMemo, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './index.css';
import './App.css';

/**
 * Neon Fun Theme tokens (Playful)
 * Electric brights & dark base
 */
const themeTokens = {
  primary: '#10B981',
  secondary: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  background: '#0B1220', // darker playful base
  surface: '#111827',
  text: '#F9FAFB',
  gradient: 'linear-gradient(90deg, #34D399 0%, #FBBF24 50%, #F87171 100%)',
  subtle: '#374151',
  border: 'rgba(255,255,255,0.08)',
  glow: '0 0 16px rgba(16,185,129,0.35)',
};

const play = (s) => s;

/**
 * Basic feature flags coming from env (string) to toggle future items (chat)
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
  /** This badge uses playful neon styling with rounded pill and glow. */
  const map = {
    Active: { bg: 'rgba(16,185,129,0.15)', color: themeTokens.primary },
    Resting: { bg: 'rgba(55,65,81,0.35)', color: '#9CA3AF' },
    Feeding: { bg: 'rgba(245,158,11,0.2)', color: themeTokens.secondary },
  };
  const cfg = map[status] || map.Active;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 0.3,
        boxShadow: status === 'Active' ? themeTokens.glow : 'none',
      }}
      aria-label={`status ${status}`}
    >
      <span style={{
        width: 8, height: 8, borderRadius: 999, background: cfg.color, boxShadow: status === 'Active' ? themeTokens.glow : 'none'
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
      background: 'rgba(239,68,68,0.15)',
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
      <span style={{ color: '#9CA3AF', fontSize: 12 }}>Date Range</span>
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
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900 }}>
      <span style={{
        width: 28, height: 28, borderRadius: 8,
        background: themeTokens.gradient, boxShadow: themeTokens.glow
      }} />
      <span style={{
        backgroundImage: themeTokens.gradient,
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontSize: 18,
        letterSpacing: 0.5
      }}>
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
  const isActive = (path) => location.pathname === path;
  const tabStyle = (active) => ({
    padding: '10px 14px',
    borderRadius: 12,
    fontWeight: 700,
    color: active ? themeTokens.text : '#9CA3AF',
    background: active ? 'rgba(52,211,153,0.1)' : 'transparent',
    textDecoration: 'none',
    border: `1px solid ${active ? 'rgba(52,211,153,0.35)' : 'transparent'}`,
    boxShadow: active ? themeTokens.glow : 'none'
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 16, borderBottom: `1px solid ${themeTokens.border}`, background: themeTokens.surface, position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Logo />
        <div style={{ height: 24, width: 1, background: themeTokens.border }} />
        <label style={{ color: '#9CA3AF', fontSize: 12 }}>Species</label>
        <select
          aria-label="Species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          style={{
            background: '#0F172A',
            color: themeTokens.text,
            border: `1px solid ${themeTokens.border}`,
            borderRadius: 12,
            padding: '8px 12px',
            fontWeight: 700,
            boxShadow: themeTokens.glow
          }}
        >
          <option value="Giant Anteater">Giant Anteater</option>
          <option value="Pangolin" disabled>pangolin (Coming Soon)</option>
          <option value="Sloth" disabled>sloth (Coming Soon)</option>
        </select>

        <div style={{ marginLeft: 8, display: 'flex', gap: 4 }}>
          <Link to="/dashboard" style={tabStyle(isActive('/dashboard'))}>Dashboard</Link>
          <Link to="/timeline" style={tabStyle(isActive('/timeline'))}>Timeline</Link>
          <Link to="/reports" style={tabStyle(isActive('/reports'))}>Reports</Link>
          <Link to="/alerts" style={tabStyle(isActive('/alerts'))}>Alerts</Link>
          <Link
            to={showChatTab ? '/chat' : '/dashboard'}
            style={{ ...tabStyle(isActive('/chat')), opacity: showChatTab ? 1 : 0.5, cursor: showChatTab ? 'pointer' : 'not-allowed' }}
            aria-disabled={!showChatTab}
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
            padding: '6px 10px', borderRadius: 999, border: `1px dashed ${themeTokens.border}`, color: '#9CA3AF', fontSize: 12
          }}>Tips: Press ?</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          border: `1px solid ${themeTokens.border}`, borderRadius: 12, background: '#0F172A'
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
      color: '#9CA3AF'
    }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14 }}>{description}</div>
    </div>
  );
}

function ErrorState({ message = 'Something went wrong. Please try again.' }) {
  return (
    <div role="alert" style={{
      border: `1px solid rgba(239,68,68,0.35)`,
      padding: 16,
      borderRadius: 12,
      background: 'rgba(239,68,68,0.08)',
      color: themeTokens.error,
      fontWeight: 700
    }}>
      {message}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * VideoModal stub with controls and metadata
 */
function VideoModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50
    }}>
      <div style={{
        background: themeTokens.surface, border: `1px solid ${themeTokens.border}`,
        borderRadius: 16, width: 'min(100%, 980px)', overflow: 'hidden', color: themeTokens.text
      }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${themeTokens.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800 }}>Video Preview</div>
          <button onClick={onClose} style={primaryGhostBtnStyle}>Close</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, padding: 16 }}>
          <div style={{
            background: '#0B1220', border: `1px solid ${themeTokens.border}`, borderRadius: 12,
            height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF'
          }}>
            [ Placeholder Player ]
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Metadata</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#D1D5DB', lineHeight: 1.8 }}>
              <li>Species: Giant Anteater</li>
              <li>Behavior: Feeding</li>
              <li>Confidence: 0.92</li>
              <li>Timestamp: 2025-01-22 14:37:09</li>
            </ul>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button style={primaryBtnStyle}>Download</button>
              <button style={primaryGhostBtnStyle}>Open in Timeline</button>
            </div>
          </div>
        </div>
        <div style={{ padding: 16, borderTop: `1px solid ${themeTokens.border}`, display: 'flex', gap: 8 }}>
          <button style={controlBtnStyle}>⏮</button>
          <button style={controlBtnStyle}>⏯</button>
          <button style={controlBtnStyle}>⏭</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button style={primaryGhostBtnStyle}>1x</button>
            <button style={primaryGhostBtnStyle}>CC</button>
            <button style={primaryGhostBtnStyle}>HD</button>
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
  color: '#0B1220',
  fontWeight: 800,
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  cursor: 'pointer',
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
  background: '#0F172A',
  color: themeTokens.text,
  fontWeight: 800,
  border: `1px solid ${themeTokens.border}`,
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
};

/**
 * Pages
 */

// PUBLIC_INTERFACE
function LoginPage() {
  const { setAuthed } = useAuth();
  const [error, setError] = useState('');
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
  };
  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text, display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={onSubmit} style={{
        width: 'min(100%, 420px)', background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo />
        </div>
        <div className="title" style={{ textAlign: 'center', fontWeight: 900, marginBottom: 6 }}>Welcome to VizAI</div>
        <div className="subtitle" style={{ textAlign: 'center', color: '#9CA3AF', marginBottom: 20 }}>
          Sign in to continue
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
  background: '#0B1220',
  border: `1px solid ${themeTokens.border}`,
  color: themeTokens.text,
  padding: '10px 12px',
  borderRadius: 12,
  margin: '8px 0 14px',
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
    <div style={{
      border: `1px solid ${themeTokens.border}`,
      borderRadius: 16,
      padding: 16,
      background: disabled ? '#0B1220' : themeTokens.surface,
      opacity: disabled ? 0.6 : 1,
      boxShadow: active ? themeTokens.glow : 'none'
    }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#9CA3AF', marginBottom: 12 }}>{description}</div>
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
  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          <ChartBlock title="Behavior Count">
            <EmptyState title="Behavior Count" description="Chart placeholder" />
          </ChartBlock>
          <ChartBlock title="Behavior Duration (toggle)">
            <EmptyState title="Behavior Duration" description="Toggle by count/duration" />
          </ChartBlock>
          <ChartBlock title="Daily Activity Pattern">
            <EmptyState title="Daily Activity Pattern" description="Chart placeholder" />
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
    <div style={{
      background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 16
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
              <BehaviorEventCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </AuthedLayout>
  );
}

function FiltersPanel() {
  return (
    <div style={{
      background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 16, height: 'fit-content'
    }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Filters</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <div>
          <label style={filterLabel}>Behavior</label>
          <select style={selectStyle}>
            <option>All</option>
            <option>Active</option>
            <option>Resting</option>
            <option>Feeding</option>
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
const filterLabel = { fontSize: 12, color: '#9CA3AF', fontWeight: 700 };
const selectStyle = {
  width: '100%',
  background: '#0B1220',
  border: `1px solid ${themeTokens.border}`,
  color: themeTokens.text,
  padding: '8px 10px',
  borderRadius: 12,
  marginTop: 6
};

function BehaviorEventCard() {
  return (
    <div style={{
      border: `1px solid ${themeTokens.border}`,
      borderRadius: 14,
      background: themeTokens.surface,
      overflow: 'hidden'
    }}>
      <div style={{ height: 120, background: '#0B1220', display: 'grid', placeItems: 'center', color: '#9CA3AF' }}>
        [ Thumbnail ]
      </div>
      <div style={{ padding: 12, display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusBadge status="Feeding" />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>14:37:09</span>
        </div>
        <div style={{ color: '#D1D5DB' }}>Confidence: 0.92</div>
        <div>
          <button style={primaryGhostBtnStyle}>Open</button>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function ReportsPage() {
  const [type, setType] = useState('Summary');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [openExport, setOpenExport] = useState(false);
  return (
    <AuthedLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div style={{ background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Report Builder</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={filterLabel}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
                <option>Summary</option>
                <option>Behavior Breakdown</option>
                <option>Daily Pattern</option>
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
        <div style={{ background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Preview</div>
          <EmptyState title="Report Preview" description="Preview placeholder for selected type and parameters." />
        </div>
      </div>
      {openExport && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 60
        }}>
          <div style={{ background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, width: 420, padding: 16 }}>
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
      <div style={{
        background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 16, display: 'grid', gap: 12
      }}>
        <div style={{ fontWeight: 900 }}>Alerts</div>
        <div style={{
          border: `1px solid ${themeTokens.border}`, borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center'
        }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: themeTokens.secondary, boxShadow: themeTokens.glow }} />
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
          <div style={{ background: themeTokens.surface, border: `1px solid ${themeTokens.border}`, borderRadius: 16, padding: 16, overflow: 'auto' }}>
            <div style={{ color: '#9CA3AF', marginBottom: 12 }}>Suggested:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <button style={primaryGhostBtnStyle}>Show feeding trends</button>
              <button style={primaryGhostBtnStyle}>Compare active vs resting</button>
              <button style={primaryGhostBtnStyle}>Explain daily pattern</button>
            </div>
            <div style={{ color: '#D1D5DB' }}>[ Typing indicator… ]</div>
            <div style={{ marginTop: 12, background: '#0B1220', border: `1px solid ${themeTokens.border}`, borderRadius: 12, padding: 12 }}>
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
  return (
    <div style={{ minHeight: '100vh', background: themeTokens.background, color: themeTokens.text }}>
      <ConnectionBanner visible={connLost} />
      <NavBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        showChatTab={!!featureFlags.chat}
        species={species}
        setSpecies={setSpecies}
      />
      <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        {children}
        <div style={{ marginTop: 16 }}>
          <button style={primaryGhostBtnStyle} onClick={() => setConnLost(v => !v)}>
            Toggle Connection Banner
          </button>
          <span style={{ marginLeft: 8, color: '#9CA3AF', fontSize: 12 }}>
            Research tip: hover elements for behavior vocabulary.
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
    document.documentElement.setAttribute('data-theme', 'dark');
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
