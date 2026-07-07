import React, { useState } from 'react';
import type { Telemetry } from '../lib/types';
import RobotScene from '../components/RobotScene';
import ControlPanel from '../components/ControlPanel';
import StatsDrawer from '../components/StatsDrawer';
import { Section, Row, Meter } from '../components/Panel';
import { useSettings, temp, pressure, fmtDuration } from '../lib/settings';
import { describeActivity } from '../lib/describe';
import { batteryLevel, tempLevel, loadLevel } from '../lib/status';

const LC = { good: '#22c55e', warn: '#ffb020', bad: '#ff6b6b' } as const;

export default function Dashboard({ tel, latency, conn }: { tel: Telemetry; latency: number; conn: string }) {
  const { settings } = useSettings();
  const [statsOpen, setStatsOpen] = useState(false);
  const r = tel.robot;
  const act = describeActivity(r);
  const tp = temp(r.motorTempC, settings.units);
  const pr = pressure(r.hydraulicPressureBar, settings.units);
  const hc = r.health === 'fault' ? '#ff6b6b' : r.health === 'warning' ? '#ffb020' : '#22c55e';

  return (
    <div className="h-full flex gap-3">
      {/* 3D scene — its own framed area, nothing overlapping it but a slim caption */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-white/6 bg-black/20">
        <RobotScene robot={r} animationSpeed={settings.animationSpeed} />
        <div className="absolute top-4 left-5 text-[10px] uppercase tracking-[0.25em] text-em-muted">
          EMMA-4X · Live View
        </div>
        <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: hc }} />
            <div>
              <div className="text-lg font-medium text-em-ink">{act.headline}</div>
              <div className="text-sm text-em-muted">{act.detail}</div>
            </div>
          </div>
        </div>
      </div>

      {/* single side panel, sections split by thin lines */}
      <aside className="w-80 shrink-0 glass overflow-y-auto flex flex-col">
        <Section title="Status">
          <Row label="State" value={r.status.toUpperCase()} color={hc} />
          <Row label="Mode" value={r.mode} />
          <Row label="Uptime" value={fmtDuration(r.uptimeSec)} tag="LIVE" />
          <Row label="Active faults" value={r.faults.length} color={r.faults.length ? '#ff6b6b' : '#22c55e'} />
        </Section>

        <Section title="Telemetry">
          <Row label="Battery" value={r.battery.toFixed(0)} unit="%" tag="SIM" color={LC[batteryLevel(r.battery)]} />
          <Meter value={r.battery} color={LC[batteryLevel(r.battery)]} />
          <div className="h-2" />
          <Row label="Motor temp" value={tp.value} unit={tp.unit} tag="SIM" color={LC[tempLevel(r.motorTempC)]} />
          <Meter value={(r.motorTempC / 120) * 100} color={LC[tempLevel(r.motorTempC)]} />
          <div className="h-2" />
          <Row label="Motor load" value={r.motorLoadPercent} unit="%" tag="SIM" color={LC[loadLevel(r.motorLoadPercent)]} />
          <Meter value={r.motorLoadPercent} color={LC[loadLevel(r.motorLoadPercent)]} />
          <div className="h-3" />
          <Row label="Hydraulic" value={pr.value} unit={pr.unit} tag="SIM" />
          <Row label="Speed" value={r.actualSpeed} unit="%" tag="SIM" />
          <Row label="Spray" value={r.sprayIntensity} unit="%" tag="SIM" />
        </Section>

        <Section title="Job">
          <div className="text-sm text-em-ink mb-1">{r.job.name}</div>
          <div className="text-xs text-em-muted mb-2">Step {r.job.stepIndex}/7 · {r.job.currentStep}</div>
          <Row label="Completion" value={r.job.completionPercent.toFixed(1)} unit="%" color="#ff6a1a" />
          <Meter value={r.job.completionPercent} />
          <div className="h-1.5" />
          <Row label="Time left" value={fmtDuration(r.job.etaSeconds)} />
        </Section>

        <Section title="Controls">
          <ControlPanel robot={r} bare />
        </Section>

        <div className="px-4 py-3.5 hairline mt-auto">
          <button
            onClick={() => setStatsOpen(true)}
            className="btn w-full text-white font-semibold py-2.5 text-sm shadow-glowOrange"
            style={{ background: 'linear-gradient(90deg,#ff8a1a,#ff5a00)' }}
          >
            View all stats →
          </button>
        </div>
      </aside>

      <StatsDrawer tel={tel} latency={latency} conn={conn} open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}
