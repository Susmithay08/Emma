import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Settings {
  theme: 'dark' | 'light';
  units: 'metric' | 'imperial';
  animationSpeed: number; // 0.25 - 2
  operatorName: string;
  refreshRate: number; // display hint (server pushes 1Hz)
}

const DEFAULTS: Settings = {
  theme: 'dark',
  units: 'metric',
  animationSpeed: 1,
  operatorName: 'A. Operator',
  refreshRate: 1,
};

const Ctx = createContext<{
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('emma-settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('emma-settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.documentElement.classList.toggle('light', settings.theme === 'light');
  }, [settings]);

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);

// ---- unit + formatting helpers ------------------------------------------
export function temp(c: number, units: Settings['units']) {
  return units === 'imperial'
    ? { value: Math.round(c * 1.8 + 32), unit: '°F' }
    : { value: Math.round(c * 10) / 10, unit: '°C' };
}

export function pressure(bar: number, units: Settings['units']) {
  return units === 'imperial'
    ? { value: Math.round(bar * 14.5038), unit: 'psi' }
    : { value: Math.round(bar), unit: 'bar' };
}

export function area(m2: number, units: Settings['units']) {
  return units === 'imperial'
    ? { value: Math.round(m2 * 10.7639 * 10) / 10, unit: 'ft²' }
    : { value: Math.round(m2 * 10) / 10, unit: 'm²' };
}

export function fmtDuration(sec: number | null): string {
  if (sec == null) return '—';
  if (sec <= 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour12: false });
}
