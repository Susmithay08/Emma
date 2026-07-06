import React from 'react';
import { useSettings } from '../lib/settings';
import type { Telemetry } from '../lib/types';
import { generateReport } from '../lib/report';

export default function Settings({ tel, latency }: { tel: Telemetry | null; latency: number }) {
  const { settings, update } = useSettings();

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-4 max-w-3xl">
      <Section title="Appearance">
        <Row label="Theme" hint="Switch between dark industrial and light HMI themes">
          <Toggle
            options={[
              ['dark', 'Dark'],
              ['light', 'Light'],
            ]}
            value={settings.theme}
            onChange={(v) => update({ theme: v as 'dark' | 'light' })}
          />
        </Row>
        <Row label="Animation Speed" hint={`${settings.animationSpeed.toFixed(2)}× — affects 3D & camera motion`}>
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.25}
            value={settings.animationSpeed}
            onChange={(e) => update({ animationSpeed: Number(e.target.value) })}
            className="w-48 accent-emma-orange"
          />
        </Row>
      </Section>

      <Section title="Units & Display">
        <Row label="Measurement Units" hint="Metric (°C, bar, m²) or Imperial (°F, psi, ft²)">
          <Toggle
            options={[
              ['metric', 'Metric'],
              ['imperial', 'Imperial'],
            ]}
            value={settings.units}
            onChange={(v) => update({ units: v as 'metric' | 'imperial' })}
          />
        </Row>
        <Row label="Display Refresh Rate" hint="Server streams telemetry at 1 Hz over WebSocket">
          <select
            value={settings.refreshRate}
            onChange={(e) => update({ refreshRate: Number(e.target.value) })}
            className="bg-steel-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value={0.5}>0.5 Hz</option>
            <option value={1}>1 Hz</option>
            <option value={2}>2 Hz</option>
          </select>
        </Row>
      </Section>

      <Section title="Operator">
        <Row label="Operator Name" hint="Shown on the badge and session report">
          <input
            value={settings.operatorName}
            onChange={(e) => update({ operatorName: e.target.value })}
            className="bg-steel-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 w-56 focus:border-emma-orange focus:outline-none"
          />
        </Row>
      </Section>

      <Section title="Session Report">
        <Row label="Export PDF" hint="Generate a downloadable snapshot of the current session">
          <button
            onClick={() => tel && generateReport(tel, latency, settings.operatorName)}
            disabled={!tel}
            className="btn bg-gradient-to-r from-emma-orange to-emma-amber text-steel-950 font-bold px-5 py-2.5"
          >
            ⬇ Download Report
          </button>
        </Row>
      </Section>

      <div className="text-xs text-slate-600 font-mono px-1">
        EMMA Operator Console v1.0.0 · Simulation build · No external hardware required
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-5">
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1">
      <div>
        <div className="text-sm font-semibold text-slate-200">{label}</div>
        {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  options,
  value,
  onChange,
}: {
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-steel-800 rounded-lg p-1 gap-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`btn px-4 py-1.5 text-sm ${
            value === v ? 'bg-emma-orange text-steel-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
