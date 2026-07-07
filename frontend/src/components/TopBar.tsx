import React, { useEffect, useRef, useState } from 'react';
import type { Robot } from '../lib/types';

const HEALTH_COLOR: Record<string, string> = { healthy: '#22c55e', warning: '#ffb020', fault: '#ff5a5a' };

export default function TopBar({
  robot,
  conn,
  latency,
  operator,
  healthScore,
  onLogout,
}: {
  robot: Robot | null;
  conn: string;
  latency: number;
  operator: string;
  healthScore: number;
  onLogout: () => void;
}) {
  const [time, setTime] = useState(new Date());
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const hc = HEALTH_COLOR[robot?.health || 'healthy'];
  const faults = robot?.faults.length ?? 0;
  const bars = conn !== 'online' ? 0 : latency < 60 ? 4 : latency < 130 ? 3 : latency < 250 ? 2 : 1;

  return (
    <header className="relative z-20 h-16 shrink-0 flex items-center px-6 gap-4 border-b border-white/6">
      {/* welcome */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center text-em-orange" style={{ background: 'rgba(255,106,26,0.12)' }}>
          ⛭
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-em-ink">Welcome back, {operator}</div>
          <div className="text-[11px] text-em-muted font-mono">
            Shift A · {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* status pill */}
        <div className="hidden sm:flex items-center gap-2 chip !rounded-xl !py-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: hc }} />
          <span className="font-semibold" style={{ color: hc }}>{(robot?.status || 'idle').toUpperCase()}</span>
        </div>

        {/* connection */}
        <div className="flex items-end gap-0.5 h-4" title={`${latency}ms`}>
          {[1, 2, 3, 4].map((b) => (
            <span key={b} className="w-1 rounded-sm" style={{ height: `${b * 25}%`, background: b <= bars ? '#ff6a1a' : 'rgba(255,106,26,0.2)' }} />
          ))}
        </div>

        {/* bell */}
        <button className="relative w-9 h-9 rounded-lg grid place-items-center text-em-muted hover:text-em-ink hover:bg-white/5">
          🔔
          {faults > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-em-orange text-black text-[9px] font-bold grid place-items-center">
              {faults}
            </span>
          )}
        </button>
        {/* warning */}
        <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ color: faults ? '#ffb020' : '#8b909a' }}>⚠</div>

        {/* avatar + menu */}
        <div ref={menuRef} className="relative pl-3 border-l border-white/8">
          <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full grid place-items-center border border-em-orange/40 text-em-orange text-xs font-bold">
              {operator.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden lg:block text-em-muted text-sm">▾</span>
          </button>
          {menu && (
            <div className="absolute right-0 top-12 w-52 glass p-1.5 z-50 animate-riseIn">
              <div className="px-3 py-2 border-b border-white/6">
                <div className="text-sm font-medium text-em-ink">{operator}</div>
                <div className="text-[11px] text-em-muted">Operator · Shift A</div>
              </div>
              <button
                onClick={() => { setMenu(false); onLogout(); }}
                className="btn w-full text-left px-3 py-2 mt-1 rounded-lg text-sm text-em-ink hover:bg-white/5 flex items-center gap-2"
              >
                <span>⏻</span> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
