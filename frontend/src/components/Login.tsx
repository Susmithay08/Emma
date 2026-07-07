import React, { useState } from 'react';

export default function Login({ onLogin }: { onLogin: (operator: string) => void }) {
  const [username, setUsername] = useState('Operator');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Enter both username and password to sign in.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: username }),
      });
    } catch {
      /* backend optional at login */
    }
    setTimeout(() => onLogin(username || 'Operator'), 450);
  };

  return (
    <div className="h-full w-full flex bg-em-void overflow-hidden">
      {/* ---- Left: full brand composition ---- */}
      <div className="relative flex-1 hidden md:block">
        <img src="/ava-real.webp" alt="AVA robot" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-em-void via-em-void/50 to-em-void/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-em-void/70 to-transparent" />

        {/* logo */}
        <div className="absolute top-9 left-12 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full grid place-items-center border-2 border-em-orange">
            <span className="font-bold text-em-orange text-base">RO</span>
          </div>
          <div className="leading-tight">
            <div className="text-xl font-semibold text-white tracking-wide">ROBOOPS</div>
            <div className="text-[10px] font-bold tracking-[0.22em] text-em-orange">ROBOTIC OPERATIONS</div>
          </div>
        </div>

        {/* vertical rail label */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="text-[10px] tracking-[0.35em] text-em-muted rotate-180" style={{ writingMode: 'vertical-rl' }}>
            PRECISION&nbsp;&nbsp;|&nbsp;&nbsp;POWER&nbsp;&nbsp;|&nbsp;&nbsp;PERFORMANCE
          </div>
        </div>

        {/* tagline */}
        <div className="absolute bottom-[168px] left-12 right-8 text-sm tracking-[0.25em] text-white/80 flex items-center gap-3">
          <span>SECURE<span className="text-em-orange">.</span></span>
          <span>RELIABLE<span className="text-em-orange">.</span></span>
          <span>BUILT TO PERFORM<span className="text-em-orange">.</span></span>
          <span className="flex-1 h-px bg-white/10" />
        </div>

        {/* feature cards */}
        <div className="absolute bottom-6 left-12 right-8 glass p-4 flex items-stretch gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-white/8 shrink-0 max-w-[240px]">
            <span className="w-10 h-10 rounded-lg grid place-items-center text-em-orange border border-em-orange/30 shrink-0">
              <RobotArmIcon />
            </span>
            <div>
              <div className="text-sm font-semibold text-em-orange leading-tight">Engineered for performance.</div>
              <div className="text-[11px] text-em-muted mt-0.5">Robotic solutions that work as hard as you do.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-3 flex-1">
            <Feature icon={<ShieldIcon />} title="Secure Access" desc="Enterprise-grade security" />
            <Feature icon={<BarsIcon />} title="Real-Time Data" desc="Live monitoring & analytics" />
            <Feature icon={<RobotArmIcon />} title="Fleet Control" desc="Manage & optimize operations" />
            <Feature icon={<GearIcon />} title="System Integration" desc="Seamless connectivity" />
          </div>
        </div>
      </div>

      {/* ---- Right: sign-in ---- */}
      <div className="w-full md:w-[460px] shrink-0 flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-[400px] glass p-8 animate-riseIn">
          <div className="text-center mb-6">
            <div className="text-[11px] font-bold tracking-[0.25em] text-em-orange uppercase">Operator Console</div>
            <h1 className="h-display text-3xl font-bold text-white mt-2">Welcome Back</h1>
            <p className="text-sm text-em-muted mt-1.5">Sign in to access your system</p>
            <div className="w-10 h-0.5 bg-em-orange mx-auto mt-4 rounded-full" />
          </div>

          <label className="block mb-4">
            <span className="label">Username</span>
            <div className="mt-1.5 flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3.5 focus-within:border-em-orange transition-colors">
              <UserIcon />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" required
                className="flex-1 bg-transparent py-3 text-em-ink placeholder:text-em-muted/60 focus:outline-none" />
            </div>
          </label>

          <label className="block mb-4">
            <span className="label">Password</span>
            <div className="mt-1.5 flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3.5 focus-within:border-em-orange transition-colors">
              <LockIcon />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required
                className="flex-1 bg-transparent py-3 text-em-ink placeholder:text-em-muted/60 focus:outline-none" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="text-em-muted hover:text-em-ink"><EyeIcon off={showPw} /></button>
            </div>
          </label>

          {error && <div className="text-xs text-red-400 mb-3 -mt-1">{error}</div>}

          <div className="flex items-center justify-between mb-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none text-em-muted">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-em-orange w-4 h-4" />
              Remember me
            </label>
            <button type="button" className="text-em-orange hover:underline">Forgot Password?</button>
          </div>

          <button type="submit" disabled={busy}
            className="btn w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold text-white shadow-glowOrange"
            style={{ background: 'linear-gradient(90deg,#ff8a1a,#ff5a00)' }}>
            {busy ? 'Authenticating…' : 'SIGN IN'}
            {!busy && <span className="text-lg">→</span>}
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-em-muted">
            <span className="w-2 h-2 rounded-full bg-em-grn animate-pulse" /> Controller online · SIM, no hardware required
          </div>
        </form>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-em-orange mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-em-ink">{title}</div>
        <div className="text-[11px] text-em-muted leading-tight">{desc}</div>
      </div>
    </div>
  );
}

const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const UserIcon = () => (<svg {...s} stroke="#ff6a1a"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>);
const LockIcon = () => (<svg {...s} stroke="#ff6a1a"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>);
const EyeIcon = ({ off }: { off: boolean }) => (<svg {...s}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />{off && <path d="M4 4l16 16" />}</svg>);
const ShieldIcon = () => (<svg {...s}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>);
const BarsIcon = () => (<svg {...s}><path d="M5 20V10M12 20V4M19 20v-7" /></svg>);
const GearIcon = () => (<svg {...s}><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>);
const RobotArmIcon = () => (<svg {...s}><path d="M4 21h6M6 21v-4l4-2 3-5" /><rect x="11" y="8" width="6" height="4" rx="1" transform="rotate(-30 14 10)" /><circle cx="6" cy="17" r="1.5" /><path d="M13 4l3 2" /></svg>);
