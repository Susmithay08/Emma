import React from 'react';
import type { Telemetry } from '../lib/types';
import StatCard from '../components/StatCard';
import CameraPanel from '../components/CameraPanel';
import ControlPanel from '../components/ControlPanel';
import JobPanel from '../components/JobPanel';
import FaultPanel from '../components/FaultPanel';
import { useSettings, temp, pressure } from '../lib/settings';
import {
  batteryLevel,
  tempLevel,
  pressureLevel,
  loadLevel,
  usageLevel,
  latencyLevel,
} from '../lib/status';
import { IconBattery, IconChip, IconSpeed, IconSpray } from '../components/Icons';

export default function Dashboard({ tel, latency, conn }: { tel: Telemetry; latency: number; conn: string }) {
  const { settings } = useSettings();
  const r = tel.robot;
  const running = r.actualSpeed > 1;
  const t = temp(r.motorTempC, settings.units);
  const p = pressure(r.hydraulicPressureBar, settings.units);

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Left: stat cards + camera */}
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-4 min-h-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Battery"
            value={r.battery.toFixed(1)}
            unit="%"
            level={batteryLevel(r.battery)}
            icon={<IconBattery size={18} />}
            source="SIM"
            progress={r.battery}
          />
          <StatCard
            label="Motor Temp"
            value={t.value}
            unit={t.unit}
            level={tempLevel(r.motorTempC)}
            source="SIM"
            progress={(r.motorTempC / 120) * 100}
          />
          <StatCard
            label="Hydraulic Pressure"
            value={p.value}
            unit={p.unit}
            level={pressureLevel(r.hydraulicPressureBar, running)}
            source="SIM"
            progress={(r.hydraulicPressureBar / 220) * 100}
          />
          <StatCard
            label="Motor Load"
            value={r.motorLoadPercent}
            unit="%"
            level={loadLevel(r.motorLoadPercent)}
            source="SIM"
            progress={r.motorLoadPercent}
          />
          <StatCard
            label="Robot Speed"
            value={r.actualSpeed}
            unit="%"
            level="good"
            icon={<IconSpeed size={18} />}
            source="SIM"
            sub={`Setpoint ${r.commandedSpeed}%`}
            progress={r.actualSpeed}
          />
          <StatCard
            label="Spray Intensity"
            value={r.sprayIntensity}
            unit="%"
            level="good"
            icon={<IconSpray size={18} />}
            source="SIM"
            progress={r.sprayIntensity}
          />
          <StatCard
            label="CPU Usage"
            value={tel.system.cpuPercent.toFixed(0)}
            unit="%"
            level={usageLevel(tel.system.cpuPercent)}
            icon={<IconChip size={18} />}
            source="LIVE"
            progress={tel.system.cpuPercent}
          />
          <StatCard
            label="Connection Health"
            value={conn === 'online' ? latency : '—'}
            unit={conn === 'online' ? 'ms' : ''}
            level={conn === 'online' ? latencyLevel(latency) : 'bad'}
            source="LIVE"
            sub={conn === 'online' ? 'WebSocket · 1 Hz' : 'Reconnecting…'}
          />
        </div>

        <div className="flex-1 min-h-[240px]">
          <CameraPanel robot={r} animationSpeed={settings.animationSpeed} />
        </div>
      </div>

      {/* Right: control + job */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 min-h-0">
        <JobPanel robot={r} />
        <ControlPanel robot={r} />
        <div className="flex-1 min-h-[160px]">
          <FaultPanel faults={r.faults} />
        </div>
      </div>
    </div>
  );
}
