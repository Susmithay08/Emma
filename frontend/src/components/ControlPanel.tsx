import React from 'react';
import type { Robot } from '../lib/types';
import { sendControl, resetFaults, startJob, useDebouncedControl } from '../lib/useTelemetry';
import { IconPlay, IconPause, IconStop, IconHome, IconReset, IconSpeed, IconSpray } from './Icons';

function Btn({
  onClick,
  icon,
  label,
  variant = 'default',
  disabled,
  wide,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'primary' | 'danger' | 'warn';
  disabled?: boolean;
  wide?: boolean;
}) {
  const styles: Record<string, string> = {
    default: 'bg-white/5 hover:bg-white/10 text-em-ink border border-white/8',
    primary: 'bg-em-lime/85 hover:bg-em-lime text-black shadow-glow border border-em-mint/40',
    danger: 'bg-em-orange/90 hover:bg-em-orange text-black shadow-glowOrange border border-em-orange/40',
    warn: 'bg-white/5 hover:bg-white/10 text-em-amber border border-em-amber/20',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn ${styles[variant]} flex flex-col items-center justify-center gap-1.5 py-3.5 ${wide ? 'col-span-2' : ''} min-h-[76px]`}
    >
      <span>{icon}</span>
      <span className="text-[11px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}

function Slider({
  label,
  value,
  icon,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 label">
          <span style={{ color: accent }}>{icon}</span> {label}
        </span>
        <span className="h-display text-lg font-bold tabular-nums" style={{ color: accent }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, ${accent} ${value}%, rgba(127,242,168,0.12) ${value}%)`,
          borderRadius: 999,
          height: 4,
        }}
      />
    </div>
  );
}

export default function ControlPanel({ robot, compact, bare }: { robot: Robot; compact?: boolean; bare?: boolean }) {
  const debounced = useDebouncedControl();
  const [speed, setSpeed] = React.useState(robot.commandedSpeed);
  const [spray, setSpray] = React.useState(robot.sprayIntensity);
  React.useEffect(() => setSpeed(robot.commandedSpeed), [robot.commandedSpeed]);
  React.useEffect(() => setSpray(robot.sprayIntensity), [robot.sprayIntensity]);

  const running = robot.status === 'running';
  const paused = robot.status === 'paused';
  const estop = robot.status === 'estop';
  const criticalActive = robot.faults.some((f) => f.severity === 'critical');

  const inner = (
    <>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {!running && !paused ? (
          <Btn onClick={() => startJob()} icon={<IconPlay size={24} />} label="Start Job" variant="primary" wide disabled={estop || criticalActive} />
        ) : paused ? (
          <Btn onClick={() => sendControl('resume')} icon={<IconPlay size={24} />} label="Resume" variant="primary" wide />
        ) : (
          <Btn onClick={() => sendControl('pause')} icon={<IconPause size={24} />} label="Pause" variant="warn" wide />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Btn onClick={() => sendControl('estop')} icon={<IconStop size={22} />} label="E-Stop" variant="danger" />
        <Btn onClick={() => sendControl('home')} icon={<IconHome size={20} />} label="Home" disabled={estop} />
        <Btn onClick={() => resetFaults()} icon={<IconReset size={20} />} label="Reset" variant="warn" />
      </div>

      <div className="space-y-4 pt-3 border-t border-white/8">
        <Slider label="Speed" value={speed} icon={<IconSpeed size={16} />} accent="#ff6a1a" onChange={(v) => { setSpeed(v); debounced('speed', v); }} />
        <Slider label="Spray" value={spray} icon={<IconSpray size={16} />} accent="#7cc4ff" onChange={(v) => { setSpray(v); debounced('spray', v); }} />
      </div>
    </>
  );

  if (bare) return inner;

  return (
    <div className="glass edge-lit p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="h-display text-sm font-bold uppercase tracking-widest text-em-ink">Controls</h3>
        <span className="chip">Manual override</span>
      </div>
      {inner}
    </div>
  );
}
