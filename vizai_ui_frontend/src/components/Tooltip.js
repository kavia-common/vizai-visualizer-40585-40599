/**
 * Lightweight tooltip component for hover interactions.
 * Neon Fun styling: surface background, subtle shadow, text #374151, label accent #10B981.
 * Usage:
 *  <Tooltip visible={true} x={100} y={100} label="Moving" detail="42.1%" />
 */
// PUBLIC_INTERFACE
import React from 'react';

const SURFACE = 'var(--surface, #FFFFFF)';
const TEXT = '#374151'; // per Neon Fun text color requirement
const BORDER = 'var(--border, #E5E7EB)';
const SHADOW = 'var(--shadow, 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1))';
const PRIMARY = '#10B981';

export default function Tooltip({ visible, x, y, label, detail, ariaId = 'chart-tooltip' }) {
  if (!visible) return null;
  const style = {
    position: 'fixed',
    left: Math.max(8, x + 12),
    top: Math.max(8, y + 12),
    zIndex: 1000,
    background: SURFACE,
    color: TEXT,
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: '8px 10px',
    boxShadow: SHADOW,
    pointerEvents: 'none',
    maxWidth: 260,
    fontSize: 12,
  };

  return (
    <div role="tooltip" id={ariaId} style={style} aria-live="polite">
      <div style={{ fontWeight: 800, color: PRIMARY }}>{label}</div>
      <div style={{ marginTop: 2 }}>{detail}</div>
    </div>
  );
}
