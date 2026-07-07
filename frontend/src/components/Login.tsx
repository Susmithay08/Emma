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
      {/* Left: brand hero image (robot + logo stay framed) */}
      <div className="relative flex-1 hidden md:block">
        <img src="/login.png" alt="Temple Allen" className="absolute inset-0 w-full h-full object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-em-void" />
      </div>

      {/* Right: sign-in column */}
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
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="flex-1 bg-transparent py-3 text-em-ink placeholder:text-em-muted/60 focus:outline-none"
                required
              />
            </div>
          </label>

          <label className="block mb-4">
            <span className="label">Password</span>
            <div className="mt-1.5 flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3.5 focus-within:border-em-orange transition-colors">
              <LockIcon />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="flex-1 bg-transparent py-3 text-em-ink placeholder:text-em-muted/60 focus:outline-none"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="text-em-muted hover:text-em-ink">
                <EyeIcon off={showPw} />
              </button>
            </div>
          </label>

          {error && <div className="text-xs text-red-400 mb-3 -mt-1">{error}</div>}

          <div className="flex items-center justify-between mb-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none text-em-muted">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-em-orange w-4 h-4" />
              Remember me
            </label>
            <button type="button" className="text-em-orange hover:underline">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold text-white shadow-glowOrange"
            style={{ background: 'linear-gradient(90deg,#ff8a1a,#ff5a00)' }}
          >
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

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6a1a" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6a1a" strokeWidth="1.8" strokeLinecap="round">
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
  </svg>
);
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);
