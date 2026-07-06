import React, { useState } from 'react';

export default function Login({ onLogin }: { onLogin: (operator: string) => void }) {
  const [name, setName] = useState('A. Operator');
  const [id, setId] = useState('OP-4471');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: name }),
      });
    } catch {
      /* backend optional at login */
    }
    setTimeout(() => onLogin(name), 500);
  };

  return (
    <div className="h-full w-full flex items-center justify-center grid-floor relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-steel-950/40 to-steel-950" />
      {/* animated scanline */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="h-32 w-full bg-gradient-to-b from-transparent via-emma-orange/20 to-transparent animate-scan" />
      </div>

      <form onSubmit={submit} className="relative glass p-8 w-[400px] max-w-[90vw]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emma-orange to-emma-amber flex items-center justify-center font-black text-steel-950 text-3xl shadow-glow mb-3">
            E
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-wide">EMMA Operator Console</h1>
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mt-1">
            Robotic Surface Preparation
          </p>
        </div>

        <label className="block mb-4">
          <span className="card-label">Operator Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full bg-steel-800 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:border-emma-orange focus:outline-none"
            required
          />
        </label>
        <label className="block mb-6">
          <span className="card-label">Badge ID</span>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1.5 w-full bg-steel-800 border border-white/10 rounded-xl px-4 py-3 text-slate-100 font-mono focus:border-emma-orange focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="btn w-full bg-gradient-to-r from-emma-orange to-emma-amber text-steel-950 font-bold py-3.5 text-base shadow-glow"
        >
          {busy ? 'Authenticating…' : 'Sign In to Console'}
        </button>

        <div className="mt-5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Controller online
          </span>
          <span className="font-mono">SIM · No hardware required</span>
        </div>
      </form>
    </div>
  );
}
