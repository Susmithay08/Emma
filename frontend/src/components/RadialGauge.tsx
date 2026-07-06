import React from 'react';
import { Level, LEVEL_COLOR } from '../lib/status';

interface Props {
  value: number; // 0-100
  label: string;
  display: string;
  level?: Level;
  size?: number;
}

export default function RadialGauge({ value, label, display, level = 'good', size = 130 }: Props) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c * 0.75; // 270° arc
  const color = LEVEL_COLOR[level];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#26303f"
          strokeWidth={9}
          strokeDasharray={c}
          strokeDashoffset={c * 0.25}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
        />
      </svg>
      <div className="-mt-[calc(50%+4px)] flex flex-col items-center pointer-events-none" style={{ marginTop: -(size / 2) - 18 }}>
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {display}
        </span>
        <span className="card-label mt-1">{label}</span>
      </div>
      <div style={{ height: size / 2 - 18 }} />
    </div>
  );
}
