import React, { useMemo, useState } from 'react';
import { formatMs } from '../utils/metrics';

/**
/ PUBLIC_INTERFACE
/ HourlyBreakdownChart
/ A lightweight SVG stacked bar visualization showing hour-by-hour durations per behavior.
/
* Props:
* - series: { hours: Array<{ hour: number, totalsByBehavior: Record<string,{durationMs:number,occurrences:number}>, totalDurationMs:number, totalOccurrences:number }> }
* - colors: Record<string,string> behavior colors
* - highlightHours?: number[] hours to visually emphasize (peak hours)
* - legendBehaviors: string[] - order for legend and stacking
*/
export default function HourlyBreakdownChart({ series, colors, highlightHours = [], legendBehaviors = [] }) {
  const [hover, setHover] = useState(null);
  const maxDuration = useMemo(() => {
    return Math.max(1, ...series.hours.map(h => h.totalDurationMs || 0));
  }, [series]);

  const barWidth = 1000; // viewBox width
  const barHeight = 240; // total chart height
  const hourGap = 4;
  const colWidth = (barWidth - hourGap * (series.hours.length - 1)) / series.hours.length;

  const isHighlight = (h) => highlightHours.includes(h);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${barWidth} ${barHeight}`} className="w-full h-60 rounded-xl shadow-md"
           style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,158,11,0.08))' }}>
        {series.hours.map((h, idx) => {
          const x = idx * (colWidth + hourGap);
          let yCursor = barHeight - 20; // leave for axis labels
          // Build stacks
          const parts = legendBehaviors
            .map(b => ({ behavior: b, dur: h.totalsByBehavior[b]?.durationMs || 0 }))
            .filter(p => p.dur > 0);
          const stackTotal = h.totalDurationMs || 0;

          return (
            <g key={h.hour} transform={`translate(${x},0)`}>
              {/* background column */}
              <rect x={0} y={0} width={colWidth} height={barHeight - 20}
                    rx="10" fill={isHighlight(h.hour) ? 'rgba(16,185,129,0.18)' : 'rgba(0,0,0,0.04)'} />
              {/* stacks */}
              {parts.map((p, i) => {
                const height = stackTotal > 0 ? ((p.dur / maxDuration) * (barHeight - 40)) : 0;
                yCursor -= height;
                return (
                  <g key={`${p.behavior}-${i}`}>
                    <rect
                      x={4}
                      y={yCursor}
                      width={colWidth - 8}
                      height={height}
                      rx="8"
                      fill={colors[p.behavior] || '#999'}
                      onMouseEnter={() => setHover({ hour: h.hour, behavior: p.behavior, duration: p.dur, occurrences: h.totalsByBehavior[p.behavior]?.occurrences || 0, x: x + (colWidth/2), y: yCursor })}
                      onMouseLeave={() => setHover(null)}
                    />
                  </g>
                );
              })}
              {/* hour label */}
              <text x={colWidth / 2} y={barHeight - 4} textAnchor="middle" fontSize="12" fill="#374151">{String(h.hour).padStart(2, '0')}</text>
            </g>
          );
        })}
        {/* Hover tooltip emulation (simple) */}
        {hover && (
          <g>
            <rect x={hover.x - 80} y={hover.y - 40} width="160" height="36" rx="8" fill="white" stroke="rgba(0,0,0,0.1)"/>
            <text x={hover.x} y={hover.y - 22} textAnchor="middle" fontSize="12" fill="#111827">
              {hover.behavior} @ {String(hover.hour).padStart(2,'0')}:00
            </text>
            <text x={hover.x} y={hover.y - 8} textAnchor="middle" fontSize="12" fill="#6B7280">
              {formatMs(hover.duration)} • {hover.occurrences} occ
            </text>
          </g>
        )}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-2">
        {legendBehaviors.map(b => (
          <div key={b} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: colors[b] || '#999' }} />
            <span className="text-sm text-gray-700">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
