import React, { useEffect, useState } from 'react';
import type { Robot } from '../lib/types';
import { HEALTH_COLOR } from '../lib/status';
import { latencyLevel, LEVEL_COLOR } from '../lib/status';

const STATUS_LABEL: Record<string, string> = {
  idle: 'IDLE',
  running: 'RUNNING',
  paused: 'PAUSED',
  estop: 'E-STOP',
  returning: 'RETURNING',
  homing: 'HOMING',
};

export default function Header({
  robot,
  conn,
  latency,
  operator,
  healthScore,
}: {
  robot: Robot | null;
  conn: string;
  latency: number;
  operator: string;
  healthScore: number;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const health = robot?.health || 'healthy';
  const barCount = conn !== 'online' ? 0 : latency < 60 ? 4 : latency < 120 ? 3 : latency < 220 ? 2 : 1;

  return (
    <header className="h-16 shrink-0 glass !rounded-none !border-x-0 !border-t-0 px-5 flex items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emma-orange to-emma-amber flex items-center justify-center font-black text-steel-950 text-lg shadow-glow">
          E
        </div>
        <div>
          <div className="font-bold text-slate-100 leading-tight tracking-wide">EMMA</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Operator Console</div>
        </div>
      </div>

      {/* Center status pills */}
      <div className="hidden md:flex items-center gap-2.5">
        <Pill label="Robot">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: HEALTH_COLOR[health] }}
            />
            <span className="font-bold" style={{ color: HEALTH_COLOR[health] }}>
              {STATUS_LABEL[robot?.status || 'idle']}
            </span>
          </span>
        </Pill>
        <Pill label="Mode">
          <span className="text-slate-200 font-semibold">{robot?.mode || '—'}</span>
        </Pill>
        <Pill label="Health">
          <span className="font-bold tabular-nums" style={{ color: HEALTH_COLOR[health] }}>
            {healthScore}
          </span>
          <span className="text-slate-500 text-xs">/100</span>
        </Pill>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        {/* Connection quality */}
        <div className="flex items-center gap-2">
          <div className="flex items-end gap-0.5 h-4">
            {[1, 2, 3, 4].map((b) => (
              <span
                key={b}
                className="w-1 rounded-sm transition-colors"
                style={{
                  height: `${b * 25}%`,
                  background: b <= barCount ? LEVEL_COLOR[latencyLevel(latency)] : '#374357',
                }}
              />
            ))}
          </div>
          <div className="text-right leading-tight">
            <div
              className={`text-xs font-bold ${
                conn === 'online' ? 'text-emerald-400' : conn === 'connecting' ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {conn === 'online' ? 'ONLINE' : conn === 'connecting' ? 'LINKING' : 'OFFLINE'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{latency}ms</div>
          </div>
        </div>

        {/* Operator badge */}
        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
          <div className="w-9 h-9 rounded-full bg-steel-700 flex items-center justify-center text-sm font-bold text-emma-orange">
            {operator.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden lg:block leading-tight">
            <div className="text-xs font-semibold text-slate-200">{operator}</div>
            <div className="text-[10px] text-slate-500 font-mono tabular-nums">
              {now.toLocaleTimeString([], { hour12: false })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Pill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-steel-800/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}
