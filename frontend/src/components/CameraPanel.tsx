import React, { useRef, useEffect } from 'react';
import type { Robot, Obstacle } from '../lib/types';

// Draw a recognizable object (obstacle) centered at (x, y).
function drawObject(ctx: CanvasRenderingContext2D, type: Obstacle['type'], x: number, y: number, s: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (type === 'crate') {
    const w = 34 * s,
      h = 28 * s;
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#5c3a17';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, h / 2);
    ctx.moveTo(w / 2, -h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.stroke();
  } else if (type === 'toolbox') {
    const w = 34 * s,
      h = 22 * s;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#7d2318';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    // handle
    ctx.beginPath();
    ctx.moveTo(-8 * s, -h / 2);
    ctx.lineTo(-8 * s, -h / 2 - 8 * s);
    ctx.lineTo(8 * s, -h / 2 - 8 * s);
    ctx.lineTo(8 * s, -h / 2);
    ctx.stroke();
  } else {
    // cone
    const w = 30 * s,
      h = 34 * s;
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(-w / 2, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w / 3, -2 * s, (w * 2) / 3, 6 * s);
    ctx.fillStyle = '#c85a10';
    ctx.fillRect(-w / 2 - 3 * s, h / 2, w + 6 * s, 5 * s);
  }
  ctx.restore();
}

// EMMA robot working view: a side view of the arm stripping an aircraft panel.
// The panel changes from corroded → clean as the job progresses, and the robot
// detects obstacles, pushes them aside, then continues.
export default function CameraPanel({ robot, animationSpeed }: { robot: Robot; animationSpeed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const robotRef = useRef(robot);
  robotRef.current = robot;
  const rafRef = useRef<number>();
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const armPhaseRef = useRef(0);
  const clearAnim = useRef<{ id: number; t: number }>({ id: -1, t: 0 });

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
      const r = robotRef.current;
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      const hc = r.health === 'fault' ? '#ef4444' : r.health === 'warning' ? '#f59e0b' : '#22c55e';

      const clearingOb = r.obstacles.find((o) => o.state === 'clearing');
      const painting = r.status === 'running' && !clearingOb;
      if (r.status === 'running') armPhaseRef.current += 0.05 * animationSpeed;
      const phase = armPhaseRef.current;

      // clearing animation timer
      if (clearingOb) {
        if (clearAnim.current.id !== clearingOb.id) clearAnim.current = { id: clearingOb.id, t: 0 };
        clearAnim.current.t += 0.03 * animationSpeed;
      } else {
        clearAnim.current = { id: -1, t: 0 };
      }

      // ---- Background ----
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#10161f');
      bg.addColorStop(1, '#080b11');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,107,26,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      const floorY = h * 0.88;
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
        pT = h * 0.46,
        pB = h * 0.72;
      const pW = pR - pL;
      const frontier = pL + (r.job.completionPercent / 100) * pW;
      // uncoated (old coating)
      ctx.fillStyle = '#3b3326';
      ctx.fillRect(pL, pT, pW, pB - pT);
      ctx.fillStyle = 'rgba(120,90,40,0.5)';
      for (let i = 0; i < 50; i++) {
        const sx = frontier + Math.random() * (pR - frontier);
        if (sx > pR || sx < pL) continue;
        ctx.fillRect(sx, pT + Math.random() * (pB - pT), 2, 2);
      }
      // cleaned metal
      const mg = ctx.createLinearGradient(0, pT, 0, pB);
      mg.addColorStop(0, '#9fb4c9');
      mg.addColorStop(0.5, '#c7d6e6');
      mg.addColorStop(1, '#7d90a6');
      ctx.fillStyle = mg;
      ctx.fillRect(pL, pT, frontier - pL, pB - pT);
      // rivets
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let x = pL + 14; x < pR; x += 28) {
        ctx.beginPath();
        ctx.arc(x, pT + 8, 2, 0, 7);
        ctx.arc(x, pB - 8, 2, 0, 7);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(pL, pT, pW, pB - pT);
      if (painting) {
        ctx.strokeStyle = hc;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(frontier, pT - 4);
        ctx.lineTo(frontier, pB + 4);
        ctx.stroke();
      }

      // ---- Obstacles (drawn as real objects) ----
      const panelMidY = (pT + pB) / 2;
      r.obstacles.forEach((o) => {
        const ox = pL + (o.atPercent / 100) * pW;
        if (o.state === 'cleared') {
          // moved aside → sitting on the floor below, faded
          drawObject(ctx, o.type, ox, floorY - 16, 0.8, 0.75);
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('✓', ox, floorY - 40);
          ctx.textAlign = 'left';
        } else if (o.state === 'clearing') {
          // shake, then slide down toward the floor as it's pushed aside
          const t = clearAnim.current.t;
          const shake = Math.sin(t * 22) * 4 * Math.max(0, 1 - t);
          const slide = Math.min(1, Math.max(0, (t - 0.6) / 1.2));
          const oy = panelMidY + slide * (floorY - 16 - panelMidY);
          drawObject(ctx, o.type, ox + shake, oy, 1, 1);
          // warning ring
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(ox - 26, oy - 24, 52, 48);
          ctx.setLineDash([]);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('MOVING ASIDE', ox, oy - 32);
          ctx.textAlign = 'left';
        } else {
          // ahead — sitting on the panel in the robot's path
          drawObject(ctx, o.type, ox, panelMidY, 1, 1);
        }
      });

      // ---- Overhead gantry rail ----
      const railY = h * 0.09;
      ctx.fillStyle = '#2a3444';
      ctx.fillRect(0, railY - 6, w, 12);
      ctx.fillStyle = '#1a2331';
      for (let x = 10; x < w; x += 60) ctx.fillRect(x, railY - 6, 6, 12);

      // ---- Carriage + arm ----
      // When clearing, the arm leans toward the obstacle to push it.
      const clearingX = clearingOb ? pL + (clearingOb.atPercent / 100) * pW : frontier;
      const cx = Math.max(pL, Math.min(pR, clearingOb ? clearingX : frontier));
      const jitter = painting ? Math.sin(phase * 6) * 3 : 0;
      const push = clearingOb ? Math.sin(clearAnim.current.t * 10) * 6 : 0;
      const elbowX = cx + (clearingOb ? push : Math.sin((r.joints[1] || 0) + phase) * 18);
      const elbowY = (railY + pT) / 2;
      const nozX = cx + (clearingOb ? push : 0);
      const nozY = (clearingOb ? panelMidY - 10 : pT - 6) + jitter;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#48566b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(cx, railY + 16);
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(nozX, nozY);
      ctx.stroke();
      ctx.fillStyle = hc;
      [
        [cx, railY + 16],
        [elbowX, elbowY],
      ].forEach(([jx, jy]) => {
        ctx.beginPath();
        ctx.arc(jx, jy, 6, 0, 7);
        ctx.fill();
      });
      // carriage
      ctx.fillStyle = '#374357';
      ctx.fillRect(cx - 22, railY - 2, 44, 20);
      ctx.fillStyle = hc;
      ctx.fillRect(cx - 22, railY + 14, 44, 4);
      // nozzle head
      ctx.fillStyle = '#1a2331';
      ctx.beginPath();
      ctx.moveTo(nozX - 8, nozY);
      ctx.lineTo(nozX + 8, nozY);
      ctx.lineTo(nozX, nozY + 12);
      ctx.closePath();
      ctx.fill();

      // ---- Spray + particles (only while actually painting) ----
      if (painting) {
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

      // ---- Status hints ----
      ctx.textAlign = 'center';
      if (r.status === 'idle') {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px monospace';
        ctx.fillText('▸ Press START JOB to begin surface preparation', w / 2, h * 0.28);
      } else if (r.status === 'paused') {
        ctx.fillStyle = 'rgba(245,158,11,0.9)';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('❚❚ PAUSED', w / 2, h * 0.28);
      }
      ctx.textAlign = 'left';
    };
    draw();
    return () => {
      cancelAnimationFrame(rafRef.current!);
      ro.disconnect();
    };
  }, [animationSpeed]);

  const estop = robot.status === 'estop';
  const clearing = robot.obstacles.some((o) => o.state === 'clearing');

  return (
    <div className="glass p-0 overflow-hidden relative h-full">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ minHeight: 240 }} />

      {/* HUD overlay */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 bg-black/55 rounded-lg px-2.5 py-1 backdrop-blur">
            <span className="w-2 h-2 rounded-full animate-pulse bg-sky-400" />
            <span className="text-[11px] font-mono font-bold text-white tracking-wider">
              CAM-01 • ROBOT VIEW
            </span>
          </div>
          <div className="bg-black/55 rounded-lg px-2.5 py-1 backdrop-blur text-[11px] font-mono text-slate-300">
            {new Date().toLocaleTimeString([], { hour12: false })} • {robot.job.completionPercent.toFixed(0)}%
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="bg-black/55 rounded-lg px-2.5 py-1.5 backdrop-blur">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Task</div>
            <div className="text-xs font-semibold text-white">{robot.job.currentStep}</div>
          </div>
          <div className="bg-black/55 rounded-lg px-2.5 py-1.5 backdrop-blur font-mono text-[11px] text-slate-300">
            Speed {robot.actualSpeed}% • Spray {robot.sprayIntensity}%
          </div>
        </div>
      </div>

      {clearing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500/90 text-black text-xs font-bold px-3 py-1.5 rounded-lg animate-pulse pointer-events-none">
          ⚠ OBSTACLE DETECTED — MOVING ASIDE
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
