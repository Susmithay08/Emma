import React from 'react';
import type { Robot } from '../lib/types';
import CamScene from './CamScene';

// Surface-prep "camera": a live 3D view of EMMA stripping the panel, with HUD
// overlays for task, obstacles and safety state.
export default function CameraPanel({ robot, animationSpeed }: { robot: Robot; animationSpeed: number }) {
  const estop = robot.status === 'estop';
  const clearing = robot.obstacles.some((o) => o.state === 'clearing');

  return (
    <div className="glass edge-lit p-0 overflow-hidden relative h-full">
      <div className="absolute inset-0">
        <CamScene robot={robot} animationSpeed={animationSpeed} />
      </div>

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="chip !bg-black/55">
            <span className="w-2 h-2 rounded-full animate-pulse bg-em-mint" />
            <span className="font-mono font-bold text-white tracking-wider">CAM-01 • SURFACE PREP</span>
          </div>
          <div className="chip !bg-black/55 font-mono text-em-muted">
            {new Date().toLocaleTimeString([], { hour12: false })} • {robot.job.completionPercent.toFixed(0)}%
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="glass-tight px-2.5 py-1.5">
            <div className="label">Task</div>
            <div className="text-xs font-semibold text-em-ink">{robot.job.currentStep}</div>
          </div>
          <div className="glass-tight px-2.5 py-1.5 font-mono text-[11px] text-em-muted">
            Speed {robot.actualSpeed}% • Spray {robot.sprayIntensity}%
          </div>
        </div>
      </div>

      {clearing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-em-amber/90 text-black text-xs font-bold px-3 py-1.5 rounded-lg animate-pulse pointer-events-none">
          ⚠ OBSTACLE DETECTED — MOVING ASIDE
        </div>
      )}
      {robot.status === 'paused' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-em-amber font-bold text-xl tracking-widest pointer-events-none h-display">
          ❚❚ PAUSED
        </div>
      )}
      {estop && (
        <div className="absolute inset-0 bg-red-950/40 grid place-items-center pointer-events-none">
          <span className="text-red-400 font-bold text-lg tracking-widest border-2 border-red-500 px-4 py-2 rounded-lg bg-black/60">
            ⛔ FEED HALTED — E-STOP
          </span>
        </div>
      )}
    </div>
  );
}
