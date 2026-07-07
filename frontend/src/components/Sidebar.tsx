import React from 'react';
import { IconDashboard, IconRobot, IconDiagnostics, IconHistory } from './Icons';

export type Page = 'overview' | 'dashboard' | 'robot' | 'diagnostics' | 'history';

const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <IconDashboard size={20} /> },
  { id: 'dashboard', label: 'Live View', icon: <IconRobot size={20} /> },
  { id: 'robot', label: 'Robots', icon: <IconRobot size={20} /> },
  { id: 'diagnostics', label: 'Analytics', icon: <IconDiagnostics size={20} /> },
  { id: 'history', label: 'Events', icon: <IconHistory size={20} /> },
];

// Auto-hiding rail: 64px icon strip by default, expands to a labelled panel on
// hover (overlays content, so it never reflows the 3D canvas).
export default function Sidebar({
  page,
  setPage,
  faultCount,
  health,
}: {
  page: Page;
  setPage: (p: Page) => void;
  faultCount: number;
  health: string;
}) {
  const hc = health === 'fault' ? '#ff5a5a' : health === 'warning' ? '#ffb020' : '#22c55e';
  return (
    <div className="relative z-30 w-16 shrink-0 h-full">
      <nav className="group absolute inset-y-0 left-0 w-16 hover:w-56 transition-[width] duration-200 ease-out overflow-hidden bg-em-void/90 backdrop-blur-xl border-r border-white/6 flex flex-col py-4">
        {/* brand */}
        <div className="flex items-center gap-2.5 px-[18px] mb-6 h-11">
          <div className="w-9 h-9 shrink-0 rounded-full grid place-items-center border-2 border-em-orange">
            <span className="font-bold text-em-orange text-xs leading-none">RO</span>
          </div>
          <div className="leading-tight opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <div className="font-semibold text-em-ink tracking-wide text-[13px]">ROBOOPS</div>
            <div className="text-[8px] font-bold tracking-[0.2em] text-em-orange">ROBOTIC OPERATIONS</div>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-2.5">
          {NAV.map((n) => {
            const active = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                title={n.label}
                className={`btn relative flex items-center gap-3 h-11 px-[7px] rounded-lg ${
                  active ? 'bg-em-orange/15 text-em-orange' : 'text-em-muted hover:text-em-ink hover:bg-white/5'
                }`}
              >
                <span className="w-7 shrink-0 grid place-items-center">{n.icon}</span>
                <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {n.label}
                </span>
                {n.id === 'diagnostics' && faultCount > 0 && (
                  <span className="absolute left-7 top-1.5 min-w-4 h-4 px-1 rounded-full bg-em-orange text-black text-[9px] font-bold grid place-items-center group-hover:hidden">
                    {faultCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* status */}
        <div className="mt-auto px-[18px] flex items-center gap-3 h-8">
          <span className="w-2.5 h-2.5 shrink-0 rounded-full animate-pulse" style={{ background: hc }} />
          <span className="text-xs text-em-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {health === 'fault' ? 'Fault active' : health === 'warning' ? 'Warnings' : 'All systems operational'}
          </span>
        </div>
      </nav>
    </div>
  );
}
