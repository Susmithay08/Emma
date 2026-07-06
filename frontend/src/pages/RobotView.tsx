import React from 'react';
import type { Telemetry } from '../lib/types';
import RobotArm3D from '../components/RobotArm3D';
import ControlPanel from '../components/ControlPanel';
import { useSettings } from '../lib/settings';
import { HEALTH_COLOR } from '../lib/status';

export default function RobotView({ tel }: { tel: Telemetry }) {
  const { settings } = useSettings();
  const r = tel.robot;
  const running = r.status === 'running';

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-12 xl:col-span-8 min-h-[400px] relative glass overflow-hidden p-0">
        <RobotArm3D
          joints={r.joints}
          health={r.health}
          running={running}
          animationSpeed={settings.animationSpeed}
        />
        {/* overlay legend */}
        <div className="absolute top-4 left-4 glass px-4 py-3 !rounded-xl">
          <div className="text-sm font-bold text-slate-100 mb-2">EMMA-4X Articulated Arm</div>
          <div className="space-y-1.5 text-xs">
            {[
              ['healthy', 'Healthy'],
              ['warning', 'Warning'],
              ['fault', 'Fault'],
            ].map(([k, label]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: HEALTH_COLOR[k] }} />
                <span className={r.health === k ? 'text-slate-100 font-semibold' : 'text-slate-500'}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 glass px-4 py-2 !rounded-xl font-mono text-[11px] text-slate-400">
          Drag to rotate · Scroll to zoom · Right-drag to pan
        </div>
        <div className="absolute top-4 right-4 glass px-4 py-3 !rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
          {r.joints.map((j, i) => (
            <div key={i} className="flex justify-between gap-4">
              <span className="text-slate-500">J{i + 1}</span>
              <span className="tabular-nums" style={{ color: HEALTH_COLOR[r.health] }}>
                {(j * (180 / Math.PI)).toFixed(1)}°
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-12 xl:col-span-4">
        <ControlPanel robot={r} />
      </div>
    </div>
  );
}
