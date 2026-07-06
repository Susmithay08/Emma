import React from 'react';
import type { Fault } from '../lib/types';
import { ackFault, resetFaults } from '../lib/useTelemetry';
import { fmtTime } from '../lib/settings';
import { IconWarning, IconReset } from './Icons';

const SEV: Record<string, { ring: string; text: string; bg: string; label: string }> = {
  critical: { ring: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500/10', label: 'CRITICAL' },
  warning: { ring: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500/10', label: 'WARNING' },
  info: { ring: 'border-sky-500/50', text: 'text-sky-400', bg: 'bg-sky-500/10', label: 'INFO' },
};

export default function FaultPanel({ faults }: { faults: Fault[] }) {
  return (
    <div className="glass p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-300">
          <IconWarning size={16} className="text-amber-400" /> Active Faults
          {faults.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {faults.length}
            </span>
          )}
        </h3>
        {faults.length > 0 && (
          <button
            onClick={() => resetFaults()}
            className="btn bg-steel-700 hover:bg-steel-600 text-amber-300 text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <IconReset size={14} /> Reset All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[120px]">
        {faults.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <span className="text-emerald-400 text-xl">✓</span>
            </div>
            <span className="text-sm">No active faults — all systems nominal</span>
          </div>
        ) : (
          faults.map((f) => {
            const s = SEV[f.severity] || SEV.info;
            return (
              <div key={f.id} className={`rounded-xl border ${s.ring} ${s.bg} p-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.text} bg-black/30`}>
                      {s.label}
                    </span>
                    <span className="font-semibold text-sm text-slate-100">{f.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                    {fmtTime(f.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{f.description}</p>
                <p className="text-xs text-slate-300 mt-1.5">
                  <span className="text-slate-500">↳ Recommended: </span>
                  {f.action}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  {f.acknowledged ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      ✓ Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => ackFault(f.id)}
                      className={`btn ${s.bg} ${s.text} border ${s.ring} text-xs px-3 py-1.5`}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
