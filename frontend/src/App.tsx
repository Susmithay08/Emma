import React, { useEffect, useState } from 'react';
import { SettingsProvider, useSettings } from './lib/settings';
import { useTelemetry, sendControl, startJob } from './lib/useTelemetry';
import Header from './components/Header';
import Sidebar, { Page } from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import RobotView from './pages/RobotView';
import Diagnostics from './pages/Diagnostics';
import History from './pages/History';
import Settings from './pages/Settings';
import type { Telemetry } from './lib/types';

// Derive a 0-100 system health score from live + modelled signals.
function computeHealthScore(tel: Telemetry | null): number {
  if (!tel) return 0;
  const r = tel.robot;
  let score = 100;
  if (r.status === 'estop') score -= 55;
  r.faults.forEach((f) => (score -= f.severity === 'critical' ? 25 : 10));
  if (r.motorTempC > 95) score -= 15;
  else if (r.motorTempC > 80) score -= 6;
  if (r.battery < 15) score -= 15;
  else if (r.battery < 25) score -= 6;
  if (tel.system.cpuPercent > 90) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function Console() {
  const { settings } = useSettings();
  const [loggedIn, setLoggedIn] = useState(false);
  const [operator, setOperator] = useState(settings.operatorName);
  const [page, setPage] = useState<Page>('dashboard');
  const { telemetry, conn, latency } = useTelemetry();

  // Keyboard shortcuts: Space=Pause, Enter=Start, Esc=E-Stop
  useEffect(() => {
    if (!loggedIn) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        sendControl('pause');
      } else if (e.code === 'Enter') {
        e.preventDefault();
        const st = telemetry?.robot.status;
        if (st === 'paused') sendControl('resume');
        else startJob();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        sendControl('estop');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loggedIn, telemetry]);

  if (!loggedIn) {
    return (
      <Login
        onLogin={(name) => {
          setOperator(name);
          setLoggedIn(true);
        }}
      />
    );
  }

  const robot = telemetry?.robot ?? null;
  const estop = robot?.status === 'estop';
  const healthScore = computeHealthScore(telemetry);

  return (
    <div className="h-full flex flex-col">
      <Header robot={robot} conn={conn} latency={latency} operator={operator} healthScore={healthScore} />

      {/* Emergency stop banner */}
      {estop && (
        <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between animate-pulse shrink-0">
          <div className="flex items-center gap-3 font-bold tracking-wide">
            <span className="text-xl">⛔</span> EMERGENCY STOP ACTIVE — ALL MOTION HALTED
          </div>
          <button
            onClick={() => fetch('/api/reset', { method: 'POST' })}
            className="btn bg-white text-red-600 font-bold px-4 py-1.5 text-sm"
          >
            Reset & Clear
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <Sidebar page={page} setPage={setPage} faultCount={robot?.faults.length ?? 0} />
        <main className="flex-1 p-4 min-w-0 overflow-hidden">
          {!telemetry ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-10 h-10 border-3 border-emma-orange border-t-transparent rounded-full animate-spin" />
              <span>Connecting to EMMA controller…</span>
            </div>
          ) : page === 'dashboard' ? (
            <Dashboard tel={telemetry} latency={latency} conn={conn} />
          ) : page === 'robot' ? (
            <RobotView tel={telemetry} />
          ) : page === 'diagnostics' ? (
            <Diagnostics tel={telemetry} />
          ) : page === 'history' ? (
            <History />
          ) : (
            <Settings tel={telemetry} latency={latency} />
          )}
        </main>
      </div>

      {/* Keyboard hint bar */}
      <div className="h-8 shrink-0 glass !rounded-none !border-x-0 !border-b-0 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-mono">
        <span><kbd className="text-slate-300">Enter</kbd> Start/Resume</span>
        <span><kbd className="text-slate-300">Space</kbd> Pause</span>
        <span><kbd className="text-slate-300">Esc</kbd> E-Stop</span>
        <span className="text-slate-600">·</span>
        <span>Telemetry {conn === 'online' ? '● live' : '○ offline'}</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Console />
    </SettingsProvider>
  );
}
