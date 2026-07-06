import React from 'react';
import {
  IconDashboard,
  IconRobot,
  IconDiagnostics,
  IconHistory,
  IconSettings,
} from './Icons';

export type Page = 'dashboard' | 'robot' | 'diagnostics' | 'history' | 'settings';

const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { id: 'robot', label: 'Robot View', icon: <IconRobot /> },
  { id: 'diagnostics', label: 'Diagnostics', icon: <IconDiagnostics /> },
  { id: 'history', label: 'History', icon: <IconHistory /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

export default function Sidebar({
  page,
  setPage,
  faultCount,
}: {
  page: Page;
  setPage: (p: Page) => void;
  faultCount: number;
}) {
  return (
    <nav className="w-20 lg:w-24 shrink-0 glass !rounded-none !border-y-0 !border-l-0 flex flex-col items-center py-4 gap-2">
      {NAV.map((n) => {
        const active = page === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={`btn relative w-16 lg:w-20 py-3 flex flex-col items-center gap-1.5 ${
              active
                ? 'bg-emma-orange/15 text-emma-orange'
                : 'text-slate-500 hover:text-slate-200 hover:bg-steel-800/60'
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-emma-orange" />
            )}
            <span className="relative">
              {n.icon}
              {n.id === 'diagnostics' && faultCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {faultCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium tracking-wide">{n.label}</span>
          </button>
        );
      })}
      <div className="mt-auto text-[9px] text-slate-600 font-mono text-center leading-tight">
        EMMA
        <br />
        v1.0.0
      </div>
    </nav>
  );
}
