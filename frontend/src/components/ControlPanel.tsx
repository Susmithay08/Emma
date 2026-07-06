import React from 'react';
import type { Robot } from '../lib/types';
import { sendControl, resetFaults, startJob, useDebouncedControl } from '../lib/useTelemetry';
import { IconPlay, IconPause, IconStop, IconHome, IconReset, IconSpeed, IconSpray } from './Icons';

function CtrlButton({
  onClick,
  icon,
  label,
  variant = 'default',
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'primary' | 'danger' | 'warn';
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    default: 'bg-steel-700 hover:bg-steel-600 text-slate-100',
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    warn: 'bg-steel-700 hover:bg-steel-600 text-amber-300',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn ${styles[variant]} flex flex-col items-center justify-center gap-1.5 py-4 px-2 min-h-[84px]`}
    >
      <span>{icon}</span>
      <span className="text-xs font-semibold tracking-wide">{label}</span>
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
        <span className="flex items-center gap-2 card-label" style={{ color: undefined }}>
          <span className="text-slate-500">{icon}</span> {label}
        </span>
        <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${value}%, #26303f ${value}%, #26303f 100%)`,
        }}
      />
    </div>
  );
}

export default function ControlPanel({ robot }: { robot: Robot }) {
  const debounced = useDebouncedControl();
  const [speed, setSpeed] = React.useState(robot.commandedSpeed);
  const [spray, setSpray] = React.useState(robot.sprayIntensity);

  // keep in sync when server changes it (e.g. reset)
  React.useEffect(() => setSpeed(robot.commandedSpeed), [robot.commandedSpeed]);
  React.useEffect(() => setSpray(robot.sprayIntensity), [robot.sprayIntensity]);

  const running = robot.status === 'running';
  const paused = robot.status === 'paused';
  const estop = robot.status === 'estop';
  const criticalActive = robot.faults.some((f) => f.severity === 'critical');

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Control</h3>
        <span className="text-[10px] text-slate-500 font-mono">HOLD-TO-CONFIRM DISABLED · SIM</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {!running && !paused ? (
          <CtrlButton
            onClick={() => startJob()}
            icon={<IconPlay size={26} />}
            label="Start Job"
            variant="primary"
            disabled={estop || criticalActive}
          />
        ) : paused ? (
          <CtrlButton
            onClick={() => sendControl('resume')}
            icon={<IconPlay size={26} />}
            label="Resume"
            variant="primary"
          />
        ) : (
          <CtrlButton onClick={() => sendControl('pause')} icon={<IconPause size={26} />} label="Pause" variant="warn" />
        )}
        <CtrlButton
          onClick={() => sendControl('pause')}
          icon={<IconPause size={26} />}
          label="Pause"
          disabled={!running}
        />
        <CtrlButton onClick={() => sendControl('home')} icon={<IconHome size={24} />} label="Return Home" disabled={estop} />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <CtrlButton
          onClick={() => sendControl('estop')}
          icon={<IconStop size={26} />}
          label="EMERGENCY STOP"
          variant="danger"
        />
        <CtrlButton onClick={() => resetFaults()} icon={<IconReset size={24} />} label="Reset Faults" variant="warn" />
      </div>

      <div className="space-y-5 pt-2 border-t border-white/5">
        <Slider
          label="Robot Speed"
          value={speed}
          icon={<IconSpeed size={16} />}
          accent="#ff6b1a"
          onChange={(v) => {
            setSpeed(v);
            debounced('speed', v);
          }}
        />
        <Slider
          label="Spray Intensity"
          value={spray}
          icon={<IconSpray size={16} />}
          accent="#38bdf8"
          onChange={(v) => {
            setSpray(v);
            debounced('spray', v);
          }}
        />
      </div>
    </div>
  );
}
