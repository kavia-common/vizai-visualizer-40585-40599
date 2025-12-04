import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFilters } from '../context/FiltersContext';
import Tooltip from './Tooltip';

// Neon Fun palette
const COLORS = {
  primary: '#10B981',
  secondary: '#F59E0B',
  text: '#374151',
  surface: '#FFFFFF',
  muted: '#6B7280',
  border: 'var(--border, #E5E7EB)',
  shadow: 'var(--shadow, 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1))',
};

// PUBLIC_INTERFACE
export const SUPPORTED_BEHAVIORS = ['Pacing','Recumbent','Scratching','Self-Directed','Moving','Non-Recumbent'];

/**
 * PUBLIC_INTERFACE
 * BehaviorExplorer
 * A reusable explorer that displays cards/sections for the selected behavior including:
 * - Summary stats (count, total duration, avg duration)
 * - Mini trend line (mock), distribution chips (time-of-day buckets)
 * - Quick actions (View Timeline, Filter by this behavior)
 * - A selector to change behavior and reflect FiltersContext and query params
 * This component reads filters (date range/hours/behavior) from FiltersContext and deep-links to Timeline/Reports.
 */
export default function BehaviorExplorer({
  initialBehavior,          // optional string to force initial selection
  behaviors = SUPPORTED_BEHAVIORS,
  compact = false,
}) {
  const { behaviorType, setBehaviorType, dateRange, hoursRange, apply } = useFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Select current behavior from URL ?behavior= or FiltersContext, else first supported
  const currentBehavior = useMemo(() => {
    return (
      searchParams.get('behavior') ||
      initialBehavior ||
      (typeof behaviorType === 'string' ? behaviorType : Array.isArray(behaviorType) && behaviorType.length ? behaviorType[0] : null) ||
      behaviors[0]
    );
  }, [searchParams, initialBehavior, behaviorType, behaviors]);

  // Sync URL and FiltersContext when currentBehavior changes
  useEffect(() => {
    if (!currentBehavior) return;
    const curr = searchParams.get('behavior');
    if (curr !== currentBehavior) {
      const next = new URLSearchParams(searchParams);
      next.set('behavior', currentBehavior);
      setSearchParams(next, { replace: true });
    }
    if (behaviorType !== currentBehavior) {
      setBehaviorType(currentBehavior);
      apply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBehavior]);

  // Mock dataset generator, stable for a given behavior/filter combination
  const data = useMemo(() => mockBehaviorData(currentBehavior, dateRange, hoursRange), [currentBehavior, dateRange, hoursRange]);

  const onChangeBehavior = (e) => {
    const next = e.target.value;
    setBehaviorType(next);
    apply();
    const params = new URLSearchParams(searchParams);
    params.set('behavior', next);
    setSearchParams(params);
  };

  const openTimeline = () => {
    navigate(`/timeline?behavior=${encodeURIComponent(currentBehavior)}`);
  };

  const applyFilterAndStay = () => {
    setBehaviorType(currentBehavior);
    apply();
  };

  return (
    <section className="card" style={{ borderRadius: 16, padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.text }}>Behavior Explorer</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <label htmlFor="behavior-select" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Behavior</label>
          <select
            id="behavior-select"
            aria-label="Select behavior"
            value={currentBehavior}
            onChange={onChangeBehavior}
            style={selectStyle}
          >
            {behaviors.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </header>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 12 }}>
        <SummaryCard title="Event Count" value={data.stats.count} />
        <SummaryCard title="Total Duration" value={formatHhMm(data.stats.totalMins)} />
        <SummaryCard title="Avg Duration" value={formatMmSs(data.stats.avgSecs)} />
      </div>

      {/* Content: mini trend + distribution chips */}
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 12 }}>
        <MiniTrend title={`${currentBehavior} Trend`} series={data.trend} />
        <DistributionChips title="Time-of-day Distribution" buckets={data.distribution} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button style={btnPrimary} onClick={openTimeline} title="View this behavior in Timeline" aria-label="View Timeline">
          View Timeline
        </button>
        <button style={btnSecondary} onClick={applyFilterAndStay} title="Filter app by this behavior" aria-label="Filter by this behavior">
          Filter by this behavior
        </button>
        <Link
          to={`/reports?behavior=${encodeURIComponent(currentBehavior)}`}
          style={{ ...btnSecondary, textDecoration: 'none' }}
          title="Open Reports focused on this behavior"
          aria-label="Open Reports"
        >
          Open Reports
        </Link>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          Filters respected • Date Range and Hours apply to stats
        </span>
      </div>
    </section>
  );
}

function SummaryCard({ title, value }) {
  // Render plain text values with no chip/badge styling
  return (
    <div className="card" style={{ padding: 12, borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{title}</div>
      </div>
      <div style={{ fontWeight: 900, fontSize: 20, color: COLORS.text, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function MiniTrend({ title, series }) {
  const [hover, setHover] = useState(null);
  const [xy, setXy] = useState({ x: 0, y: 0 });
  const width = 360;
  const height = 120;
  const padding = 12;
  const maxY = Math.max(1, ...series.map(p => p.y));
  const minY = 0;
  const dx = (width - padding * 2) / Math.max(1, series.length - 1);

  const points = series.map((p, i) => {
    const x = padding + i * dx;
    const y = padding + (height - padding * 2) * (1 - (p.y - minY) / (maxY - minY));
    return { ...p, x, y };
  });

  const path = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <div className="card" style={{ padding: 12, borderRadius: 14, position: 'relative' }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <svg
        role="img"
        aria-label="Mini trend line for behavior over time"
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', border: `1px solid ${COLORS.border}`, borderRadius: 12, background: 'rgba(55,65,81,0.03)' }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => setXy({ x: e.clientX, y: e.clientY })}
      >
        <path d={path} fill="none" stroke={COLORS.primary} strokeWidth="2" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={COLORS.secondary}
            stroke={COLORS.border}
            onMouseEnter={() => setHover(p)}
          />
        ))}
      </svg>
      <Tooltip
        visible={Boolean(hover)}
        x={xy.x}
        y={xy.y}
        label={hover ? hover.label : ''}
        detail={hover ? `Value: ${hover.y}` : ''}
      />
    </div>
  );
}

function DistributionChips({ title, buckets }) {
  // buckets: [{label, value, pct}]
  return (
    <div className="card" style={{ padding: 12, borderRadius: 14 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {buckets.map((b) => (
          <div key={b.label} title={`${b.label}: ${b.value} (${b.pct}%)`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.primary }} />
            <span style={{ fontWeight: 700 }}>{b.label}</span>
            <span style={{ color: COLORS.muted }}>({b.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const selectStyle = {
  width: 'auto',
  background: 'var(--surface)',
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  padding: '8px 10px',
  borderRadius: 10,
  boxShadow: COLORS.shadow,
  fontSize: 12,
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #1e8a5b 0%, #34d399 100%)',
  color: '#FFFFFF',
  fontWeight: 800,
  border: 'none',
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
  boxShadow: COLORS.shadow,
};

const btnSecondary = {
  background: 'transparent',
  color: COLORS.text,
  fontWeight: 800,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: '8px 10px',
  cursor: 'pointer',
};

/**
 * Mock behavior data generator. Produces stable numbers based on behavior label and filters.
 */
function mockBehaviorData(behavior, dateRange, hoursRange) {
  const seed = hash(`${behavior}-${dateKey(dateRange)}-${hoursKey(hoursRange)}`);
  const rng = mulberry32(seed);

  // count between 6 and 40
  const count = 6 + Math.floor(rng() * 35);
  // total minutes between 20 and 600
  const totalMins = 20 + Math.floor(rng() * 580);
  // avg secs
  const avgSecs = Math.max(20, Math.floor((totalMins * 60) / Math.max(1, count)));

  // trend series of 12 points
  const trend = Array.from({ length: 12 }).map((_, i) => ({
    label: `Day ${i + 1}`,
    y: Math.max(0, Math.floor(2 + rng() * 10)),
  }));

  // distribution across buckets (Morning/Afternoon/Evening/Night)
  const bucketLabels = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const raw = bucketLabels.map(() => Math.max(1, Math.floor(1 + rng() * 10)));
  const sum = raw.reduce((a, b) => a + b, 0);
  const buckets = raw.map((v, i) => ({
    label: bucketLabels[i],
    value: v,
    pct: ((v / sum) * 100).toFixed(0),
  }));

  return {
    stats: { count, totalMins, avgSecs },
    trend,
    distribution: buckets,
  };
}

function dateKey(range) {
  if (!range || (!range.start && !range.end)) return 'none';
  const s = range.start ? new Date(range.start).toDateString() : 'null';
  const e = range.end ? new Date(range.end).toDateString() : 'null';
  return `${s}-${e}`;
}
function hoursKey(hours) {
  if (!hours) return 'all';
  return `${hours.min ?? 'min'}-${hours.max ?? 'max'}`;
}
function formatHhMm(mins) {
  const m = Math.max(0, Math.floor(mins || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, '0')}m`;
}
function formatMmSs(secs) {
  const s = Math.max(0, Math.floor(secs || 0));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// Deterministic RNG helpers
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
