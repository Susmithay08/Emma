import React from 'react';

// Sleek, line-based side-panel primitives — sections split by hairlines,
// line-item rows, and thin meters (no chunky cards).

export function Section({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5 hairline first:border-t-0">
      {(title || action) && (
        <div className="flex items-center justify-between mb-2.5">
          {title && <h3 className="text-[10px] uppercase tracking-[0.2em] text-em-muted font-medium">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Row({ label, value, unit, color, tag }: { label: string; value: React.ReactNode; unit?: string; color?: string; tag?: 'LIVE' | 'SIM' }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-em-muted flex items-center gap-1.5">
        {label}
        {tag && (
          <span className="text-[8px] font-bold px-1 rounded" style={{ color: tag === 'LIVE' ? '#ff9a5a' : '#7cc4ff', background: tag === 'LIVE' ? 'rgba(255,106,26,0.1)' : 'rgba(124,196,255,0.1)' }}>
            {tag}
          </span>
        )}
      </span>
      <span className="text-sm font-medium tabular-nums" style={{ color: color || '#eceef2' }}>
        {value}
        {unit && <span className="text-em-muted text-xs ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

export function Meter({ value, color = '#ff6a1a' }: { value: number; color?: string }) {
  return (
    <div className="h-1 rounded-full bg-white/6 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}
