import React from 'react';

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
export const STATUS_META = {
  Active: { color: COLORS.primary, bg: 'rgba(16,185,129,0.12)', icon: '●' },
  Resting: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', icon: '⏺' },
  Monitoring: { color: COLORS.secondary, bg: 'rgba(245,158,11,0.12)', icon: '◉' },
};

/**
 * PUBLIC_INTERFACE
 * AnimalProfileCard
 * A reusable card for displaying an animal profile summary with inline details under the photo.
 * Props:
 *  - photo: string (URL to image)
 *  - name: string
 *  - age: string|number
 *  - sex: 'M'|'F'|string
 *  - enclosure: string
 *  - status: 'Active'|'Resting'|'Monitoring'|string (determines color/icon)
 *  - lastUpdated: string|Date
 *  - onClick?: function (optional card click)
 *  - compact?: boolean (reduced padding for tight placement)
 */
export default function AnimalProfileCard({
  photo,
  name,
  age,
  sex,
  enclosure,
  status = 'Monitoring',
  lastUpdated,
  onClick,
  compact = false,
}) {
  const meta = STATUS_META[status] || STATUS_META.Monitoring;
  const updatedAt = formatTimestamp(lastUpdated);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      title={`${name}`}
      aria-label={`Animal card for ${name}, last updated ${updatedAt}`}
      className="card"
      style={{
        borderRadius: 16,
        padding: compact ? 12 : 16,
        cursor: onClick ? 'pointer' : 'default',
        display: 'grid',
        gap: 10,
      }}
    >
      {/* Title row only (no chips/labels); ensure minimal top margin to avoid strip-like look */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
        <div style={{ fontWeight: 900, color: COLORS.text, fontSize: compact ? 14 : 16 }}>
          {name}
        </div>
      </div>

      {/* Inline details removed per requirement: keep card compact with only header and last updated */}
      <div style={{ height: 4 }} aria-hidden />

      <div className="muted" style={{ fontSize: 12 }}>
        Last updated:{' '}
        <time dateTime={toISOStringSafe(lastUpdated)}>{updatedAt}</time>
      </div>
    </article>
  );
}

// PUBLIC_INTERFACE
export function toISOStringSafe(d) {
  try {
    const dt = d instanceof Date ? d : d ? new Date(d) : null;
    return dt && !isNaN(dt.getTime()) ? dt.toISOString() : '';
  } catch {
    return '';
  }
}

// PUBLIC_INTERFACE
export function formatTimestamp(d) {
  const dt = d instanceof Date ? d : d ? new Date(d) : new Date();
  if (isNaN(dt.getTime())) return '—';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}
