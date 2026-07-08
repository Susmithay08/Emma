# RoboOps Console — AVA Operator Console

**🔴 Live demo → https://roboops-console.onrender.com/**

> Hosted on Render's free tier, so the first load after it's been idle may take
> ~30–60s to wake up.

A production-quality full-stack HMI (Human-Machine Interface) for **AVA** — an
industrial robotic surface-preparation system (aerospace, marine, transportation,
manufacturing).

Built with **React + TypeScript + Tailwind + React Three Fiber** (frontend) and
**Node.js + Express + WebSocket** (backend). Dark, orange-on-black RoboOps Console
theme, Jost typography. Works immediately — no hardware required.

---

## "Real data, no fake data" — how this is honoured

There is no physical robot attached, so a battery or hydraulic sensor cannot be
literally read. The console is honest about the source of every value, badged
**LIVE** or **SIM** throughout the UI:

| Source | Meaning | Examples |
|--------|---------|----------|
| **LIVE** | Genuinely real, read from the host machine via Node `os`/`process` | CPU %, memory, network latency (measured WS round-trip), uptime, platform |
| **SIM** | Physically **modelled** — a coherent simulation engine, **not** `Math.random()` noise | battery, motor temp, hydraulic pressure, motor load, job progress |

The simulation engine (`backend/src/simulation.js`) uses real physical
relationships: motor load is driven by commanded speed + spray back-pressure +
surface drag; temperature integrates toward a load-dependent equilibrium with
Newtonian cooling; battery drains as a function of instantaneous power draw;
faults trigger on genuine threshold crossings. The **Overview** dashboard is
driven entirely by this live telemetry + real host metrics + real faults — no
fabricated numbers.

---

## Run it

```bash
cd roboops
npm run install:all      # installs backend + frontend deps
npm run dev              # starts backend (:4000) + frontend (:5173) together
```

Open **http://localhost:5173** and sign in (username + any password — it's a
demo gate, not real auth). Sign out from the avatar menu, top-right.

Run pieces individually:

```bash
npm run backend          # Express + WebSocket on :4000
npm run frontend         # Vite dev server on :5173 (proxies /api + /ws)
npm run build            # production build of the frontend
```

---

## Pages

- **Overview** — real-data control room: KPIs (robot state, job completion,
  system-health score, active alerts), a live performance chart, the AVA camera
  feed, real subsystem health, and real alarms with working acknowledge. Every
  tile navigates; **Export** downloads a PDF session report.
- **Live View** — immersive 3D articulated arm (rotate / zoom / pan) with the
  arm on a glowing pad; all status/telemetry/job/controls in one side panel.
- **Robots** — 3D surface-prep scene: an IK-driven arm strips a panel (corroded →
  clean) and performs pick-and-place on obstacles (crate / toolbox / cone); side
  panel with obstacle progress, joint angles and controls.
- **Analytics** — real host CPU/memory/latency/uptime + modelled motor/hydraulic
  charts updating every second, subsystem status, host controller info.
- **Events** — searchable / filterable event log.

**Controls** everywhere: Start, Pause, Resume, Emergency Stop, Return Home,
Reset Faults; speed & spray sliders. Keyboard shortcuts: `Enter` = Start/Resume,
`Space` = Pause, `Esc` = Emergency Stop. Auto-hiding nav rail (hover to expand).

---

## API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/robot` | full telemetry snapshot (robot + live host metrics) |
| GET | `/api/diagnostics` | host metrics, subsystem health, metrics history |
| GET | `/api/fleet` | simulated fleet summary (aggregate demo) |
| GET | `/api/history` | event log (`?q=&category=&severity=`) |
| POST | `/api/control` | `{action}` or `{setpoint:{key,value}}` |
| POST | `/api/reset` | clear all faults |
| POST | `/api/fault/ack` | `{id}` acknowledge a fault |
| POST | `/api/job/start` | `{name?, surfaceAreaM2?}` |
| POST | `/api/login` | `{operator}` |
| WS | `/ws` | telemetry pushed at 1 Hz; `{type:"ping"}` → latency measurement |

---

## Structure

```
roboops/
├── backend/src/
│   ├── server.js          Express REST + WebSocket + 1 Hz sim loop
│   ├── simulation.js      physics-coherent robot model + faults + obstacles
│   ├── fleet.js           simulated fleet summary endpoint
│   └── systemMetrics.js   REAL host telemetry (os/process)
└── frontend/src/
    ├── components/        TopBar, Sidebar, RobotScene, CamScene, CameraPanel,
    │                      ControlPanel, Panel, StatCard, RadialGauge, StatsDrawer,
    │                      JobPanel, FaultPanel, Login, Icons
    ├── pages/             Overview, Dashboard (Live View), RobotView (Robots),
    │                      Diagnostics (Analytics), History (Events)
    ├── lib/               useTelemetry (WS), settings, types, status, describe,
    │                      report (PDF)
    └── App.tsx            routing, shortcuts, auth, E-Stop banner
```

> The 3D robots are built procedurally with React Three Fiber; the `Robots`
> scene uses 2-link inverse kinematics so the tool tip lands exactly on the
> work surface. `login.png` and `image1.webp` (the real AVA photo) are the only
> bundled image assets.
