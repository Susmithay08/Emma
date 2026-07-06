import React, { useEffect, useState } from 'react';
import type { Telemetry } from '../lib/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { fmtDuration } from '../lib/settings';

interface DiagData {
  system: Telemetry['system'];
  robotUptimeSec: number;
  latencyMs: number;
  metricsHistory: {
    t: number;
    cpu: number;
    mem: number;
    tempC: number;
    load: number;
    pressure: number;
    battery: number;
    latencyMs: number;
  }[];
  subsystems: Record<string, string>;
}

const SUB_COLOR: Record<string, string> = {
  ok: '#22c55e',
  warning: '#f59e0b',
  fault: '#ef4444',
};

export default function Diagnostics({ tel }: { tel: Telemetry }) {
  const [data, setData] = useState<DiagData | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/diagnostics')
        .then((r) => r.json())
        .then((d) => alive && setData(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const sys = tel.system;
  const hist = (data?.metricsHistory || []).map((d) => ({
    ...d,
    time: new Date(d.t).toLocaleTimeString([], { hour12: false }).slice(3),
  }));

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-4">
      {/* Top KPI strip — REAL host metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="CPU Usage" value={`${sys.cpuPercent.toFixed(1)}%`} src="LIVE" accent="#ff6b1a" />
        <Kpi label="Memory" value={`${sys.memory.usedPercent.toFixed(1)}%`} sub={`${sys.memory.usedMB} / ${sys.memory.totalMB} MB`} src="LIVE" accent="#38bdf8" />
        <Kpi label="Network Latency" value={`${data?.latencyMs ?? 0} ms`} src="LIVE" accent="#a78bfa" />
        <Kpi label="Robot Uptime" value={fmtDuration(data?.robotUptimeSec ?? tel.robot.uptimeSec)} src="LIVE" accent="#22c55e" />
      </div>

      {/* Subsystem status */}
      <div className="glass p-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-3">Subsystem Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(data?.subsystems || {}).map(([k, v]) => (
            <div key={k} className="bg-steel-800/50 rounded-xl p-3 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ background: SUB_COLOR[v], boxShadow: `0 0 8px ${SUB_COLOR[v]}` }} />
              <div>
                <div className="text-xs font-semibold text-slate-200 capitalize">{k}</div>
                <div className="text-[10px] uppercase tracking-wide" style={{ color: SUB_COLOR[v] }}>
                  {v}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Host CPU & Memory" badge="LIVE">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hist} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b1a" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ff6b1a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#26303f" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} minTickGap={40} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="cpu" stroke="#ff6b1a" fill="url(#gCpu)" strokeWidth={2} name="CPU %" isAnimationActive={false} />
              <Area type="monotone" dataKey="mem" stroke="#38bdf8" fill="url(#gMem)" strokeWidth={2} name="Mem %" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Motor Temperature & Load" badge="SIM">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hist} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="#26303f" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} minTickGap={40} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="tempC" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp °C" isAnimationActive={false} />
              <Line type="monotone" dataKey="load" stroke="#f59e0b" strokeWidth={2} dot={false} name="Load %" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hydraulic Pressure" badge="SIM">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hist} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gPres" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#26303f" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} minTickGap={40} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="pressure" stroke="#a78bfa" fill="url(#gPres)" strokeWidth={2} name="bar" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Battery & Latency" badge="MIXED">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hist} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="#26303f" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} minTickGap={40} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="battery" stroke="#22c55e" strokeWidth={2} dot={false} name="Battery %" isAnimationActive={false} />
              <Line type="monotone" dataKey="latencyMs" stroke="#38bdf8" strokeWidth={2} dot={false} name="Latency ms" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Host info */}
      <div className="glass p-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-3">
          Host Controller <span className="text-[10px] text-emerald-400 ml-1">LIVE</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm font-mono">
          <Info label="Platform" value={sys.platform} />
          <Info label="Hostname" value={sys.hostname} />
          <Info label="CPU Cores" value={String(sys.cores)} />
          <Info label="Node" value={sys.nodeVersion} />
          <Info label="Load Avg" value={sys.loadAvg.join(' / ')} />
          <Info label="Process RSS" value={`${sys.memory.processRssMB} MB`} />
          <Info label="Heap Used" value={`${sys.memory.processHeapMB} MB`} />
          <Info label="Host Uptime" value={fmtDuration(sys.hostUptimeSec)} />
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: '#141b26',
  border: '1px solid #26303f',
  borderRadius: 12,
  fontSize: 12,
  color: '#e2e8f0',
};

function Kpi({ label, value, sub, src, accent }: { label: string; value: string; sub?: string; src: string; accent: string }) {
  return (
    <div className="glass p-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
      <div className="flex justify-between items-start">
        <span className="card-label">{label}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">{src}</span>
      </div>
      <div className="text-2xl font-bold mt-2 tabular-nums" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">{title}</h3>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge === 'LIVE' ? 'bg-emerald-500/15 text-emerald-400' : badge === 'SIM' ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-500/15 text-slate-400'}`}>
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-slate-200 truncate" title={value}>{value}</div>
    </div>
  );
}
