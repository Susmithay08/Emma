import React from 'react';
import { Level, LEVEL_COLOR, LEVEL_TW } from '../lib/status';

interface Props {
  label: string;
  value: React.ReactNode;
  unit?: string;
  level?: Level;
  icon?: React.ReactNode;
  sub?: React.ReactNode;
  source?: 'LIVE' | 'SIM';
  progress?: number; // 0-100 bar
}

export default function StatCard({ label, value, unit, level = 'good', icon, sub, source, progress }: Props) {
  return (
    <div className="glass p-4 relative overflow-hidden group">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: LEVEL_COLOR[level], opacity: 0.9 }}
      />
      <div className="flex items-start justify-between">
        <span className="card-label">{label}</span>
        <div className="flex items-center gap-1.5">
          {source && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                source === 'LIVE'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-sky-500/15 text-sky-400'
              }`}
              title={source === 'LIVE' ? 'Real host telemetry' : 'Physics-modelled value'}
            >
              {source}
            </span>
          )}
          {icon && <span className="text-slate-500">{icon}</span>}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold tabular-nums ${LEVEL_TW[level]}`}>{value}</span>
        {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
      </div>
      {progress != null && (
        <div className="mt-3 h-1.5 rounded-full bg-steel-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%`, background: LEVEL_COLOR[level] }}
          />
        </div>
      )}
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
