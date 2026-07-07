import React, { useEffect, useState } from 'react';
import { SettingsProvider, useSettings } from './lib/settings';
import { useTelemetry, sendControl, startJob } from './lib/useTelemetry';
import TopBar from './components/TopBar';
import Sidebar, { Page } from './components/Sidebar';
import Login from './components/Login';
import Overview from './pages/Overview';
import Dashboard from './pages/Dashboard';
import RobotView from './pages/RobotView';
import Diagnostics from './pages/Diagnostics';
import History from './pages/History';
import type { Telemetry } from './lib/types';

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
  const [page, setPage] = useState<Page>('overview');
  const { telemetry, conn, latency } = useTelemetry();

  useEffect(() => {
    if (!loggedIn) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); sendControl('pause'); }
      else if (e.code === 'Enter') { e.preventDefault(); telemetry?.robot.status === 'paused' ? sendControl('resume') : startJob(); }
      else if (e.code === 'Escape') { e.preventDefault(); sendControl('estop'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loggedIn, telemetry]);

  if (!loggedIn) {
    return <Login onLogin={(name) => { setOperator(name); setLoggedIn(true); }} />;
  }

  const robot = telemetry?.robot ?? null;
  const estop = robot?.status === 'estop';
  const healthScore = computeHealthScore(telemetry);
  const immersive = page === 'dashboard' || page === 'robot';
  const logout = () => { setLoggedIn(false); setPage('overview'); };

  return (
    <div className="atmosphere relative h-full flex">
      <Sidebar page={page} setPage={setPage} faultCount={robot?.faults.length ?? 0} health={robot?.health || 'healthy'} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar robot={robot} conn={conn} latency={latency} operator={operator} healthScore={healthScore} onLogout={logout} />

        {estop && (
          <div className="relative z-20 mx-4 mt-2 rounded-2xl bg-em-orange/90 text-black px-5 py-2.5 flex items-center justify-between shadow-glowOrange animate-riseIn">
            <div className="flex items-center gap-3 font-bold tracking-wide">
              <span className="text-xl">⛔</span> EMERGENCY STOP — ALL MOTION HALTED
            </div>
            <button onClick={() => fetch('/api/reset', { method: 'POST' })} className="btn bg-black/85 text-em-orange font-bold px-4 py-1.5 text-sm">
              Reset &amp; clear
            </button>
          </div>
        )}

        <main className={`flex-1 min-w-0 ${immersive ? 'p-3' : 'p-6'} overflow-hidden`}>
          {!telemetry ? (
            <div className="h-full grid place-items-center text-em-muted gap-3">
              <div className="w-10 h-10 border-2 border-em-orange border-t-transparent rounded-full animate-spin" />
              <span>Connecting to RoboOps Console controller…</span>
            </div>
          ) : page === 'overview' ? (
            <Overview tel={telemetry} latency={latency} healthScore={healthScore} setPage={setPage} />
          ) : page === 'dashboard' ? (
            <Dashboard tel={telemetry} latency={latency} conn={conn} />
          ) : page === 'robot' ? (
            <RobotView tel={telemetry} />
          ) : page === 'diagnostics' ? (
            <Diagnostics tel={telemetry} />
          ) : (
            <History />
          )}
        </main>
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
