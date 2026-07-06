// Threshold → status color logic (green / yellow / red) for gauges.
export type Level = 'good' | 'warn' | 'bad';

export const LEVEL_COLOR: Record<Level, string> = {
  good: '#22c55e',
  warn: '#f59e0b',
  bad: '#ef4444',
};

export const LEVEL_TW: Record<Level, string> = {
  good: 'text-emerald-400',
  warn: 'text-amber-400',
  bad: 'text-red-400',
};

// battery: high good, low bad
export function batteryLevel(pct: number): Level {
  if (pct > 40) return 'good';
  if (pct > 15) return 'warn';
  return 'bad';
}
export function tempLevel(c: number): Level {
  if (c < 75) return 'good';
  if (c < 95) return 'warn';
  return 'bad';
}
export function pressureLevel(bar: number, running: boolean): Level {
  if (!running) return 'good';
  if (bar > 90) return 'good';
  if (bar > 60) return 'warn';
  return 'bad';
}
export function loadLevel(pct: number): Level {
  if (pct < 70) return 'good';
  if (pct < 90) return 'warn';
  return 'bad';
}
export function usageLevel(pct: number): Level {
  if (pct < 70) return 'good';
  if (pct < 88) return 'warn';
  return 'bad';
}
export function latencyLevel(ms: number): Level {
  if (ms < 60) return 'good';
  if (ms < 150) return 'warn';
  return 'bad';
}

export const HEALTH_COLOR: Record<string, string> = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  fault: '#ef4444',
};
