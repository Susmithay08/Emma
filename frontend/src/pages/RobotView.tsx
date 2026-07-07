import React from 'react';
import type { Telemetry } from '../lib/types';
import CameraPanel from '../components/CameraPanel';
import ControlPanel from '../components/ControlPanel';
import { Section, Row } from '../components/Panel';
import { useSettings } from '../lib/settings';

const HEALTH_COLOR: Record<string, string> = { healthy: '#22c55e', warning: '#ffb020', fault: '#ff6b6b' };

export default function RobotView({ tel }: { tel: Telemetry }) {
  const { settings } = useSettings();
  const r = tel.robot;
  const hc = HEALTH_COLOR[r.health];

  return (
    <div className="h-full flex gap-3">
      {/* 3D surface-prep view */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-white/6">
        <CameraPanel robot={r} animationSpeed={settings.animationSpeed} />
      </div>

      {/* single side panel */}
      <aside className="w-80 shrink-0 glass overflow-y-auto flex flex-col">
        <Section title="Robot">
          <div className="text-sm text-em-ink font-medium">EMMA-4X · Surface Prep</div>
          <div className="text-xs text-em-muted mb-2">{r.job.name}</div>
          <Row label="State" value={r.status.toUpperCase()} color={hc} />
          <Row label="Completion" value={r.job.completionPercent.toFixed(1)} unit="%" color="#ff6a1a" />
        </Section>

        <Section title="Obstacles on path">
          {r.obstacles.map((o) => {
            const done = o.state === 'cleared';
            const active = o.state === 'clearing';
            const color = done ? '#22c55e' : active ? '#ffb020' : '#8b909a';
            return (
              <div key={o.id} className="flex items-center gap-2 py-1.5 text-sm">
                <span>{o.type === 'crate' ? '📦' : o.type === 'toolbox' ? '🧰' : '🚧'}</span>
                <span className="flex-1 capitalize text-em-ink">{o.type}</span>
                <span className="font-mono text-em-muted text-xs">{o.atPercent}%</span>
                <span style={{ color }} className="text-xs font-medium">
                  {done ? '✓ cleared' : active ? 'clearing' : 'ahead'}
                </span>
              </div>
            );
          })}
        </Section>

        <Section title="Joint angles">
          <div className="space-y-2">
            {r.joints.map((j, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono">
                <span className="text-em-muted w-6">J{i + 1}</span>
                <div className="flex-1 h-1 rounded-full bg-white/6 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${50 + (j / Math.PI) * 50}%`, background: hc }} />
                </div>
                <span className="tabular-nums w-9 text-right" style={{ color: hc }}>
                  {(j * (180 / Math.PI)).toFixed(0)}°
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Controls">
          <ControlPanel robot={r} bare />
        </Section>

        <div className="px-4 py-3 hairline mt-auto text-[11px] text-em-muted font-mono">
          Drag rotate · scroll zoom · right-drag pan
        </div>
      </aside>
    </div>
  );
}
