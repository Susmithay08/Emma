import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Robot } from '../lib/types';

type Source = 'robot' | 'internet' | 'webcam';

// Convert a YouTube / generic URL into an embeddable iframe src.
function toEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1`;
      if (u.pathname.startsWith('/embed/')) return url;
      if (u.pathname.startsWith('/live/'))
        return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}?autoplay=1&mute=1&playsinline=1`;
    }
    if (u.hostname === 'youtu.be')
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&mute=1&playsinline=1`;
    return url; // assume already embeddable
  } catch {
    return url;
  }
}

// A default 24/7 live industrial stream (editable). Ships muted + autoplay.
const DEFAULT_STREAM = 'https://www.youtube.com/watch?v=DHUnz4dyb54'; // Port of Rotterdam live cam

// Camera panel with three switchable sources:
//   • EMMA Robot  — a drawn side-view of the robot performing surface prep (SIM)
//   • Internet Cam — a genuine live web stream (LIVE, editable URL)
//   • My Webcam   — the local device camera (LIVE)
export default function CameraPanel({ robot, animationSpeed }: { robot: Robot; animationSpeed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const robotRef = useRef(robot);
  robotRef.current = robot;
  const rafRef = useRef<number>();
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);

  const [source, setSource] = useState<Source>('robot');
  const sourceRef = useRef<Source>('robot');
  sourceRef.current = source;
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [streamUrl, setStreamUrl] = useState(DEFAULT_STREAM);
  const [embedUrl, setEmbedUrl] = useState(toEmbed(DEFAULT_STREAM));

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (id?: string) => {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera API not available in this browser context.');
        return false;
      }
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: id ? { deviceId: { exact: id } } : true,
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
        setDevices(list);
        setDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId || id);
        return true;
      } catch (e: any) {
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera permission denied.'
            : e?.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Camera unavailable (${e?.name || 'error'}).`
        );
        return false;
      }
    },
    [stopStream]
  );

  const selectSource = useCallback(
    async (s: Source) => {
      setError(null);
      if (s === 'webcam') {
        const ok = await startCamera();
        if (!ok) return; // stay on current source if camera failed
      } else {
        stopStream();
      }
      setSource(s);
    },
    [startCamera, stopStream]
  );

  useEffect(() => () => stopStream(), [stopStream]);

  // ---- Canvas renderer: drawn EMMA robot + HUD -------------------------
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width) * devicePixelRatio;
      canvas.height = Math.max(1, rect.height) * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      if (sourceRef.current !== 'robot') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const r = robotRef.current;
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      const running = r.actualSpeed > 1 && r.status !== 'estop';
      const hc = r.health === 'fault' ? '#ef4444' : r.health === 'warning' ? '#f59e0b' : '#22c55e';

      // Background: workshop
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#10161f');
      bg.addColorStop(1, '#080b11');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      // faint back wall grid
      ctx.strokeStyle = 'rgba(255,107,26,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // floor
      const floorY = h * 0.86;
      ctx.fillStyle = '#0c1119';
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(w, floorY);
      ctx.stroke();

      // ---- Work surface (aircraft panel) ----
      const pL = w * 0.1,
        pR = w * 0.9,
        pT = h * 0.5,
        pB = h * 0.78;
      const pW = pR - pL;
      const frontier = pL + (r.job.completionPercent / 100) * pW;
      // uncoated (old coating) — right of frontier
      ctx.fillStyle = '#3b3326';
      ctx.fillRect(pL, pT, pW, pB - pT);
      // corrosion speckle on uncoated part
      ctx.fillStyle = 'rgba(120,90,40,0.5)';
      for (let i = 0; i < 60; i++) {
        const sx = frontier + Math.random() * (pR - frontier);
        if (sx > pR || sx < pL) continue;
        ctx.fillRect(sx, pT + Math.random() * (pB - pT), 2, 2);
      }
      // cleaned/prepared — left of frontier (bright metal)
      const mg = ctx.createLinearGradient(0, pT, 0, pB);
      mg.addColorStop(0, '#9fb4c9');
      mg.addColorStop(0.5, '#c7d6e6');
      mg.addColorStop(1, '#7d90a6');
      ctx.fillStyle = mg;
      ctx.fillRect(pL, pT, frontier - pL, pB - pT);
      // panel rivets
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let x = pL + 14; x < pR; x += 28) {
        ctx.beginPath();
        ctx.arc(x, pT + 8, 2, 0, 7);
        ctx.arc(x, pB - 8, 2, 0, 7);
        ctx.fill();
      }
      // panel border
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(pL, pT, pW, pB - pT);
      // active working edge line
      if (running) {
        ctx.strokeStyle = hc;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(frontier, pT - 4);
        ctx.lineTo(frontier, pB + 4);
        ctx.stroke();
      }

      // ---- Overhead gantry rail ----
      const railY = h * 0.1;
      ctx.fillStyle = '#2a3444';
      ctx.fillRect(0, railY - 6, w, 12);
      ctx.fillStyle = '#1a2331';
      for (let x = 10; x < w; x += 60) ctx.fillRect(x, railY - 6, 6, 12);

      // ---- Carriage + arm following the frontier ----
      const jitter = running ? Math.sin(Date.now() / 120) * 3 : 0;
      const cx = Math.max(pL, Math.min(pR, frontier));
      // carriage
      ctx.fillStyle = '#374357';
      ctx.fillRect(cx - 22, railY - 2, 44, 20);
      ctx.fillStyle = hc;
      ctx.fillRect(cx - 22, railY + 14, 44, 4);
      // arm segments (elbow bends with joint angle for life)
      const elbowX = cx + Math.sin((robotRef.current.joints[1] || 0) + Date.now() / 900) * 18;
      const elbowY = (railY + pT) / 2;
      const nozX = cx;
      const nozY = pT - 6 + jitter;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#48566b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx, railY + 16);
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(nozX, nozY);
      ctx.stroke();
      // joints
      ctx.fillStyle = hc;
      [
        [cx, railY + 16],
        [elbowX, elbowY],
      ].forEach(([jx, jy]) => {
        ctx.beginPath();
        ctx.arc(jx, jy, 6, 0, 7);
        ctx.fill();
      });
      // nozzle head
      ctx.fillStyle = '#1a2331';
      ctx.beginPath();
      ctx.moveTo(nozX - 8, nozY);
      ctx.lineTo(nozX + 8, nozY);
      ctx.lineTo(nozX, nozY + 12);
      ctx.closePath();
      ctx.fill();

      // ---- Spray + particles ----
      if (running) {
        const inten = r.sprayIntensity / 100;
        ctx.fillStyle = `rgba(120,200,255,${0.06 + inten * 0.12})`;
        ctx.beginPath();
        ctx.moveTo(nozX, nozY + 10);
        ctx.lineTo(nozX - 12 * (0.5 + inten), pT + 14);
        ctx.lineTo(nozX + 12 * (0.5 + inten), pT + 14);
        ctx.closePath();
        ctx.fill();
        if (Math.random() < 0.5 + inten) {
          for (let i = 0; i < 2; i++)
            particles.current.push({
              x: nozX + (Math.random() - 0.5) * 10,
              y: nozY + 12,
              vx: (Math.random() - 0.5) * 1.2,
              vy: 1 + Math.random() * 2 * animationSpeed,
              life: 1,
            });
        }
      }
      particles.current = particles.current.filter((p) => p.life > 0);
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        ctx.fillStyle = `rgba(160,210,255,${p.life * 0.7})`;
        ctx.fillRect(p.x, p.y, 2, 2);
      });

      // ---- Obstacles ----
      r.obstacles.forEach((o) => {
        const ox = pL + (o.x / 100) * pW;
        const oy = pT + (o.y / 100) * (pB - pT);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(ox - 16, oy - 16, 32, 32);
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('OBSTACLE', ox - 18, oy - 20);
      });

      // idle hint
      if (!running && r.status !== 'estop') {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▸ Press START JOB to begin surface preparation', w / 2, h * 0.3);
        ctx.textAlign = 'left';
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(rafRef.current!);
      ro.disconnect();
    };
  }, [animationSpeed]);

  const estop = robot.status === 'estop';
  const isLive = source !== 'robot';
  const badge =
    source === 'internet' ? 'CAM-NET • LIVE' : source === 'webcam' ? 'CAM-01 • LIVE' : 'CAM-01 • SIM';

  return (
    <div className="glass p-0 overflow-hidden relative h-full">
      {/* Internet stream */}
      {source === 'internet' && (
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Live stream"
        />
      )}
      {/* Webcam */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: source === 'webcam' ? 'block' : 'none' }}
        muted
        playsInline
      />
      {/* Robot render */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block relative"
        style={{ minHeight: 240, display: source === 'robot' ? 'block' : 'none' }}
      />
      {source !== 'robot' && <div style={{ minHeight: 240 }} />}

      {/* HUD overlay */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 bg-black/55 rounded-lg px-2.5 py-1 backdrop-blur">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isLive ? 'bg-red-500' : 'bg-sky-400'}`} />
            <span className="text-[11px] font-mono font-bold text-white tracking-wider">{badge}</span>
          </div>

          {/* Source selector (clickable) */}
          <div className="pointer-events-auto flex items-center gap-1 bg-black/55 rounded-lg p-1 backdrop-blur">
            {(
              [
                ['robot', 'EMMA Robot'],
                ['internet', 'Internet Cam'],
                ['webcam', 'My Webcam'],
              ] as [Source, string][]
            ).map(([s, label]) => (
              <button
                key={s}
                onClick={() => selectSource(s)}
                className={`text-[10px] font-semibold px-2 py-1 rounded ${
                  source === s ? 'bg-emma-orange text-steel-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="bg-black/55 rounded-lg px-2.5 py-1.5 backdrop-blur">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Task</div>
            <div className="text-xs font-semibold text-white">{robot.job.currentStep}</div>
          </div>
          <div className="bg-black/55 rounded-lg px-2.5 py-1.5 backdrop-blur font-mono text-[11px] text-slate-300">
            {new Date().toLocaleTimeString([], { hour12: false })} • {robot.job.completionPercent.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Internet URL editor */}
      {source === 'internet' && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-auto">
          <div className="flex gap-1.5 bg-black/70 rounded-lg p-1.5 backdrop-blur">
            <input
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setEmbedUrl(toEmbed(streamUrl))}
              placeholder="Paste a YouTube live URL…"
              className="flex-1 bg-steel-800 border border-white/10 rounded px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:border-emma-orange"
            />
            <button
              onClick={() => setEmbedUrl(toEmbed(streamUrl))}
              className="bg-emma-orange text-steel-950 text-[11px] font-bold px-3 rounded"
            >
              Load
            </button>
          </div>
        </div>
      )}

      {error && source === 'webcam' && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-black/75 text-amber-300 text-[11px] px-3 py-1.5 rounded-lg backdrop-blur pointer-events-none">
          {error}
        </div>
      )}

      {robot.obstacles.length > 0 && source === 'robot' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500/90 text-black text-xs font-bold px-3 py-1.5 rounded-lg animate-pulse pointer-events-none">
          ⚠ OBSTACLE DETECTED — SLOWING
        </div>
      )}
      {estop && (
        <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center pointer-events-none">
          <span className="text-red-400 font-bold text-lg tracking-widest border-2 border-red-500 px-4 py-2 rounded-lg bg-black/60">
            ⛔ FEED HALTED — E-STOP
          </span>
        </div>
      )}
    </div>
  );
}
