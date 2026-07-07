import React from 'react';
import type { Telemetry } from '../lib/types';
import CameraPanel from '../components/CameraPanel';
import ControlPanel from '../components/ControlPanel';
import { useSettings } from '../lib/settings';

const HEALTH_COLOR: Record<string, string> = { healthy: '#7ff2a8', warning: '#ffb020', fault: '#ff6b6b' };

export default function RobotView({ tel }: { tel: Telemetry }) {
  const { settings } = useSettings();
  const r = tel.robot;
  const hc = HEALTH_COLOR[r.health];
  const obs = r.obstacles;

  return (
    <div className="relative h-full w-full">
      {/* Full-bleed 3D surface-prep view */}
      <div className="absolute inset-0">
        <CameraPanel robot={r} animationSpeed={settings.animationSpeed} />
      </div>

      <div className="absolute inset-0 p-4 flex justify-between pointer-events-none gap-4">
        {/* Left: identity + obstacles progress */}
        <div className="flex flex-col gap-4 w-60 pointer-events-auto animate-riseIn">
          <div className="glass edge-lit p-4">
            <div className="h-display text-base font-bold text-em-ink">EMMA-4X · Surface Prep</div>
            <div className="label mb-3">{r.job.name}</div>
            <div className="space-y-1.5">
              {['healthy', 'warning', 'fault'].map((k) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ background: HEALTH_COLOR[k] }} />
                  <span className={r.health === k ? 'text-em-ink font-semibold capitalize' : 'text-em-muted capitalize'}>{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass edge-lit p-4">
            <div className="label mb-2.5">Obstacles on path</div>
            <div className="space-y-2">
              {obs.map((o) => {
                const done = o.state === 'cleared';
                const active = o.state === 'clearing';
                const color = done ? '#7ff2a8' : active ? '#ffb020' : '#8ea69a';
                return (
                  <div key={o.id} className="flex items-center gap-2 text-xs">
                    <span className="w-6 h-6 rounded-md grid place-items-center" style={{ background: `${color}22` }}>
                      {o.type === 'crate' ? '📦' : o.type === 'toolbox' ? '🧰' : '🚧'}
                    </span>
                    <span className="flex-1 capitalize text-em-ink">{o.type}</span>
                    <span className="font-mono text-em-muted">{o.atPercent}%</span>
                    <span style={{ color }} className="font-semibold">
                      {done ? '✓ cleared' : active ? 'clearing' : 'ahead'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-tight px-3 py-2 text-[11px] text-em-muted font-mono">
            Drag rotate · scroll zoom · right-drag pan
          </div>
        </div>

        {/* Right: joint angles + controls */}
        <div className="flex flex-col gap-4 w-80 pointer-events-auto animate-riseIn">
          <div className="glass edge-lit p-4">
            <div className="label mb-2">Joint angles</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
              {r.joints.map((j, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-em-muted w-6">J{i + 1}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${50 + (j / Math.PI) * 50}%`, background: hc }} />
                  </div>
                  <span className="tabular-nums w-9 text-right" style={{ color: hc }}>
                    {(j * (180 / Math.PI)).toFixed(0)}°
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ControlPanel robot={r} compact />
        </div>
      </div>
    </div>
  );
}
