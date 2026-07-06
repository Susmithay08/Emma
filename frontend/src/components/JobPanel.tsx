import React from 'react';
import type { Robot } from '../lib/types';
import { useSettings, area, fmtDuration } from '../lib/settings';

export default function JobPanel({ robot }: { robot: Robot }) {
  const { settings } = useSettings();
  const j = robot.job;
  const done = area(j.completedM2, settings.units);
  const total = area(j.surfaceAreaM2, settings.units);
  const pct = j.completionPercent;

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Current Job</h3>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            robot.status === 'running'
              ? 'bg-emerald-500/15 text-emerald-400'
              : robot.status === 'paused'
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-steel-700 text-slate-400'
          }`}
        >
          {robot.status.toUpperCase()}
        </span>
      </div>

      <div className="text-lg font-semibold text-slate-100 mb-1">{j.name}</div>
      <div className="text-xs text-slate-500 mb-4">Step {j.stepIndex}/7 · {j.currentStep}</div>

      {/* Progress bar */}
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-400">Completion</span>
        <span className="font-bold text-emma-orange tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-3 rounded-full bg-steel-700 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emma-orange to-emma-amber transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Surface Area" value={`${done.value} / ${total.value}`} unit={total.unit} />
        <Stat label="Time Remaining" value={fmtDuration(j.etaSeconds)} />
        <Stat label="Position" value={`X ${robot.position.x.toFixed(1)}  Y ${robot.position.y.toFixed(1)}`} unit="m" />
        <Stat label="Actual Speed" value={`${robot.actualSpeed}`} unit="%" />
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-steel-800/50 rounded-xl p-3">
      <div className="card-label mb-1">{label}</div>
      <div className="text-sm font-semibold text-slate-100 tabular-nums">
        {value} {unit && <span className="text-slate-500 text-xs">{unit}</span>}
      </div>
    </div>
  );
}
