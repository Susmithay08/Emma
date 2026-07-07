import React, { useEffect, useMemo, useState } from 'react';
import type { HistoryEvent } from '../lib/types';

const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  success: 'text-emerald-400 bg-emerald-500/10',
  info: 'text-sky-400 bg-sky-500/10',
};

export default function History() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');

  useEffect(() => {
    let alive = true;
    const load = () => {
      const params = new URLSearchParams({ q, category, severity });
      fetch(`/api/history?${params}`)
        .then((r) => r.json())
        .then((d) => alive && setEvents(d.events))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [q, category, severity]);

  const categories = useMemo(
    () => ['all', 'Control', 'Motion', 'Job', 'Fault', 'Safety', 'System', 'Auth'],
    []
  );

  return (
    <div className="glass h-full flex flex-col p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mr-auto">
          Event History <span className="text-slate-500 font-normal ml-1">({events.length})</span>
        </h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events…"
          className="bg-steel-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-ava-orange focus:outline-none w-52"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-steel-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-steel-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
        >
          {['all', 'critical', 'warning', 'success', 'info'].map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Severities' : s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-steel-850/95 backdrop-blur z-10">
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium w-32">Time</th>
              <th className="px-3 py-2 font-medium w-24">Category</th>
              <th className="px-3 py-2 font-medium w-24">Severity</th>
              <th className="px-3 py-2 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-slate-600 py-10">
                  No matching events.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-t border-white/5 hover:bg-steel-800/40">
                  <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                  </td>
                  <td className="px-3 py-2 text-slate-400">{e.category}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${SEV_COLOR[e.severity] || SEV_COLOR.info}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-200">{e.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
