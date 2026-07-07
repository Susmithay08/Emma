import React from 'react';
import type { Telemetry } from '../lib/types';
import StatCard from './StatCard';
import CameraPanel from './CameraPanel';
import FaultPanel from './FaultPanel';
import { useSettings, temp, pressure } from '../lib/settings';
import {
  batteryLevel,
  tempLevel,
  pressureLevel,
  loadLevel,
  usageLevel,
  latencyLevel,
} from '../lib/status';
import { IconBattery, IconChip, IconSpeed, IconSpray } from './Icons';

export default function StatsDrawer({
  tel,
  latency,
  conn,
  open,
  onClose,
}: {
  tel: Telemetry;
  latency: number;
  conn: string;
  open: boolean;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const r = tel.robot;
  const running = r.actualSpeed > 1;
  const t = temp(r.motorTempC, settings.units);
  const p = pressure(r.hydraulicPressureBar, settings.units);

  return (
    <>
      {/* scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* panel */}
      <aside
        className={`fixed z-40 top-0 right-0 h-full w-full sm:w-[560px] glass !rounded-none !rounded-l-3xl p-5 overflow-y-auto transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="h-display text-lg font-bold text-em-ink">Live Stats</h2>
            <p className="text-xs text-em-muted">Full telemetry · LIVE = real host · SIM = physics model</p>
          </div>
          <button onClick={onClose} className="btn w-10 h-10 grid place-items-center glass-tight text-em-ink text-lg">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <StatCard label="Battery" value={r.battery.toFixed(1)} unit="%" level={batteryLevel(r.battery)} icon={<IconBattery size={18} />} source="SIM" progress={r.battery} />
          <StatCard label="Motor Temp" value={t.value} unit={t.unit} level={tempLevel(r.motorTempC)} source="SIM" progress={(r.motorTempC / 120) * 100} />
          <StatCard label="Hydraulic" value={p.value} unit={p.unit} level={pressureLevel(r.hydraulicPressureBar, running)} source="SIM" progress={(r.hydraulicPressureBar / 220) * 100} />
          <StatCard label="Motor Load" value={r.motorLoadPercent} unit="%" level={loadLevel(r.motorLoadPercent)} source="SIM" progress={r.motorLoadPercent} />
          <StatCard label="Robot Speed" value={r.actualSpeed} unit="%" icon={<IconSpeed size={18} />} source="SIM" sub={`Setpoint ${r.commandedSpeed}%`} progress={r.actualSpeed} />
          <StatCard label="Spray" value={r.sprayIntensity} unit="%" icon={<IconSpray size={18} />} source="SIM" progress={r.sprayIntensity} />
          <StatCard label="CPU (host)" value={tel.system.cpuPercent.toFixed(0)} unit="%" level={usageLevel(tel.system.cpuPercent)} icon={<IconChip size={18} />} source="LIVE" progress={tel.system.cpuPercent} />
          <StatCard label="Connection" value={conn === 'online' ? latency : '—'} unit={conn === 'online' ? 'ms' : ''} level={conn === 'online' ? latencyLevel(latency) : 'bad'} source="LIVE" sub={conn === 'online' ? 'WebSocket · 1 Hz' : 'Reconnecting…'} />
        </div>

        <div className="mb-4 h-72">
          <CameraPanel robot={r} animationSpeed={settings.animationSpeed} />
        </div>

        <FaultPanel faults={r.faults} />
      </aside>
    </>
  );
}
