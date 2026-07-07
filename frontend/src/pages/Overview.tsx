import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { Telemetry } from '../lib/types';
import type { Page } from '../components/Sidebar';
import RadialGauge from '../components/RadialGauge';
import { generateReport } from '../lib/report';
import { ackFault } from '../lib/useTelemetry';
import { fmtTime, fmtDuration, useSettings, temp } from '../lib/settings';

interface Diag {
  metricsHistory: { t: number; load: number; battery: number; tempC: number }[];
  subsystems: Record<string, string>;
  robotUptimeSec: number;
  latencyMs: number;
}

const SUB_LABEL: Record<string, string> = {
  comms: 'Controllers',
  sensors: 'Sensors',
  vision: 'Vision System',
  hydraulic: 'Hydraulics',
  motor: 'Drive Motor',
  battery: 'Power System',
};

export default function Overview({
  tel,
  latency,
  healthScore,
  setPage,
}: {
  tel: Telemetry;
  latency: number;
  healthScore: number;
  setPage: (p: Page) => void;
}) {
  const { settings } = useSettings();
  const [diag, setDiag] = useState<Diag | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetch('/api/diagnostics').then((r) => r.json()).then((d) => alive && setDiag(d)).catch(() => {});
    load();
    const t = setInterval(load, 1500);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const r = tel.robot;
  const running = r.status === 'running';
  const stateColor = running ? '#22c55e' : r.status === 'paused' ? '#ffb020' : r.status === 'estop' ? '#ff5a5a' : '#8b909a';
  const chart = (diag?.metricsHistory || []).map((h) => ({ ...h, time: fmtTime(h.t).slice(0, 5) }));
  const subs = diag?.subsystems || {};
  const tp = temp(r.motorTempC, settings.units);

  return (
    <div className="h-full overflow-y-auto pr-1 pb-2">
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-em-ink">Overview</h1>
          <p className="text-sm text-em-muted">Live status of the EMMA-4X surface-prep cell</p>
        </div>
        <button
          onClick={() => generateReport(tel, latency, settings.operatorName)}
          className="btn text-white font-medium px-4 py-2.5 text-sm shadow-glowOrange flex items-center gap-2"
          style={{ background: 'linear-gradient(90deg,#ff8a1a,#ff5a00)' }}
        >
          ⬇ Export report
        </button>
      </div>

      {/* KPI row — all real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi label="Robot State" value={r.status.toUpperCase()} valueColor={stateColor} sub={r.mode} tag="SIM" onClick={() => setPage('robot')} />
        <Kpi label="Job Completion" value={`${r.job.completionPercent.toFixed(0)}%`} ring={r.job.completionPercent} ringColor="#ff6a1a" sub={fmtDuration(r.job.etaSeconds) + ' left'} tag="SIM" onClick={() => setPage('dashboard')} />
        <Kpi label="System Health" value={`${healthScore}`} unit="/100" ring={healthScore} ringColor={healthScore > 70 ? '#22c55e' : healthScore > 40 ? '#ffb020' : '#ff5a5a'} tag="LIVE" onClick={() => setPage('diagnostics')} />
        <Kpi label="Active Alerts" value={`${r.faults.length}`} valueColor={r.faults.length ? '#ff5a5a' : '#22c55e'} sub={r.faults.length ? 'Needs attention' : 'All clear'} alert={r.faults.length > 0} onClick={() => setPage('diagnostics')} />
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
        {/* performance chart — real metricsHistory */}
        <div className="col-span-12 xl:col-span-7 glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-em-ink">Live Performance</h3>
              <p className="text-[11px] text-em-muted">Motor load &amp; battery · updates every second</p>
            </div>
            <div className="flex gap-4 text-[11px] text-em-muted">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-em-orange" /> Load {r.motorLoadPercent}%</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-em-muted" /> Battery {r.battery.toFixed(0)}%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={chart} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#8b909a', fontSize: 10 }} minTickGap={30} />
              <YAxis domain={[0, 100]} tick={{ fill: '#8b909a', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#141518', border: '1px solid #2a2d33', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="load" stroke="#ff6a1a" strokeWidth={2.5} dot={false} name="Load %" isAnimationActive={false} />
              <Line type="monotone" dataKey="battery" stroke="#8b909a" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Battery %" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 hairline">
            <Metric label="Motor Temp" value={`${tp.value}${tp.unit}`} tag="SIM" />
            <Metric label="CPU (host)" value={`${tel.system.cpuPercent.toFixed(0)}%`} tag="LIVE" />
            <Metric label="Latency" value={`${latency} ms`} tag="LIVE" />
          </div>
        </div>

        {/* live feed — real photo, opens 3D */}
        <div className="col-span-12 xl:col-span-5 glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-em-ink">Live Feed</h3>
            <button onClick={() => setPage('robot')} className="text-xs text-em-orange hover:underline">Open 3D →</button>
          </div>
          <button onClick={() => setPage('robot')} className="relative block w-full rounded-xl overflow-hidden h-[210px] border border-white/8 group text-left">
            <img src="/emma-real.webp" alt="EMMA surface prep" className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-white">CAM-01 · LIVE</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="text-sm font-semibold text-white">EMMA-4X · Surface Prep</div>
              <div className="text-[11px] text-white/70">{r.job.currentStep} · {r.job.completionPercent.toFixed(0)}% complete</div>
            </div>
          </button>
        </div>
      </div>

      {/* bottom row */}
      <div className="grid grid-cols-12 gap-3">
        {/* cell status — the real robot */}
        <div className="col-span-12 lg:col-span-4 glass p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-em-ink">Cell Status</h3>
            <button onClick={() => setPage('robot')} className="text-xs text-em-orange hover:underline">View →</button>
          </div>
          <button onClick={() => setPage('robot')} className="w-full flex items-center gap-3 py-3 text-left">
            <span className="w-9 h-9 rounded-lg grid place-items-center text-em-orange" style={{ background: 'rgba(255,106,26,0.1)' }}>⛭</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-em-ink">EMMA-4X</div>
              <div className="text-[11px] text-em-muted truncate">{r.job.name}</div>
            </div>
            <span className="text-[10px] font-bold uppercase" style={{ color: stateColor }}>{r.status}</span>
            <span className="text-sm font-mono w-10 text-right">{r.job.completionPercent.toFixed(0)}%</span>
          </button>
          <div className="hairline pt-3 mt-1 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Uptime" value={fmtDuration(diag?.robotUptimeSec ?? r.uptimeSec)} />
            <MiniStat label="Battery" value={`${r.battery.toFixed(0)}%`} />
            <MiniStat label="Speed" value={`${r.actualSpeed}%`} />
          </div>
        </div>

        {/* system health — real subsystems */}
        <div className="col-span-12 lg:col-span-4 glass p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-em-ink">System Health</h3>
            <button onClick={() => setPage('diagnostics')} className="text-xs text-em-orange hover:underline">View all →</button>
          </div>
          <div>
            {Object.entries(subs).length === 0 ? (
              <div className="text-sm text-em-muted py-4">Loading…</div>
            ) : (
              Object.entries(subs).map(([k, st]) => {
                const c = st === 'fault' ? '#ff5a5a' : st === 'warning' ? '#ffb020' : '#22c55e';
                return (
                  <div key={k} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                    <span className="flex-1 text-sm text-em-ink">{SUB_LABEL[k] || k}</span>
                    <span className="text-xs capitalize" style={{ color: c }}>{st === 'ok' ? 'Healthy' : st}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* alarms — real faults, acknowledge works */}
        <div className="col-span-12 lg:col-span-4 glass p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-em-ink">Alarms</h3>
            <button onClick={() => setPage('diagnostics')} className="text-xs text-em-orange hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {r.faults.length === 0 ? (
              <div className="text-sm text-em-muted py-6 text-center">No active alarms — all systems nominal</div>
            ) : (
              r.faults.slice(0, 4).map((a) => {
                const c = a.severity === 'critical' ? '#ff5a5a' : '#ffb020';
                return (
                  <div key={a.id} className="flex gap-2.5 py-1.5 border-b border-white/5 last:border-0">
                    <span style={{ color: c }} className="mt-0.5">⚠</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-em-ink truncate">{a.title}</div>
                      <div className="text-[11px] text-em-muted">{fmtTime(a.timestamp)}</div>
                    </div>
                    {!a.acknowledged && (
                      <button onClick={() => ackFault(a.id)} className="text-[11px] px-2 py-1 rounded self-center" style={{ color: c, background: `${c}1a` }}>
                        Ack
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, unit, valueColor, sub, ring, ringColor, alert, tag, onClick }: {
  label: string; value: React.ReactNode; unit?: string; valueColor?: string; sub?: string;
  ring?: number; ringColor?: string; alert?: boolean; tag?: 'LIVE' | 'SIM'; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="glass p-5 flex items-center justify-between text-left hover:border-white/15 transition-colors">
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-em-muted">{label}</span>
          {tag && <span className="text-[8px] font-bold px-1 rounded" style={{ color: tag === 'LIVE' ? '#ff9a5a' : '#7cc4ff', background: tag === 'LIVE' ? 'rgba(255,106,26,0.1)' : 'rgba(124,196,255,0.1)' }}>{tag}</span>}
        </div>
        <div className="text-2xl font-semibold mt-1.5 tabular-nums" style={{ color: valueColor || '#eceef2' }}>
          {value}{unit && <span className="text-sm text-em-muted ml-0.5">{unit}</span>}
        </div>
        {sub && <div className={`text-xs mt-0.5 ${alert ? 'text-em-orange' : 'text-em-muted'}`}>{sub}</div>}
      </div>
      {ring != null ? (
        <RadialGauge value={ring} display="" label="" color={ringColor} size={58} />
      ) : (
        <span className="w-11 h-11 rounded-xl grid place-items-center text-xl" style={{ background: alert ? 'rgba(255,90,90,0.12)' : 'rgba(255,106,26,0.1)', color: alert ? '#ff5a5a' : '#ff6a1a' }}>
          {alert ? '⚠' : '⛭'}
        </span>
      )}
    </button>
  );
}

function Metric({ label, value, tag }: { label: string; value: string; tag?: 'LIVE' | 'SIM' }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-em-muted flex items-center gap-1">
        {label}
        {tag && <span className="text-[8px] font-bold px-1 rounded" style={{ color: tag === 'LIVE' ? '#ff9a5a' : '#7cc4ff', background: tag === 'LIVE' ? 'rgba(255,106,26,0.1)' : 'rgba(124,196,255,0.1)' }}>{tag}</span>}
      </div>
      <div className="text-sm font-semibold text-em-ink mt-0.5">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-em-muted">{label}</div>
      <div className="text-sm font-medium text-em-ink mt-0.5">{value}</div>
    </div>
  );
}
