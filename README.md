# EMMA Operator Console

A production-quality full-stack HMI (Human-Machine Interface) for **EMMA** — an
industrial robotic surface-preparation system used in aerospace, marine,
transportation and manufacturing.

Built with **React + TypeScript + Tailwind + React Three Fiber** (frontend) and
**Node.js + Express + WebSocket** (backend). Works immediately — no hardware required.

---

## "Real data, no fake data" — how this is honoured

There is no physical robot attached, so a battery or hydraulic sensor cannot be
literally read. The console is scrupulously honest about the source of every value,
badged **LIVE** or **SIM** throughout the UI:

| Source | Meaning | Examples |
|--------|---------|----------|
| **LIVE** | Genuinely real, read from the host machine via Node `os`/`process` | CPU %, memory, network latency (measured WS round-trip), uptime, platform, load average |
| **SIM** | Physically **modelled** — derived from a coherent simulation engine, **not** `Math.random()` noise | battery, motor temp, hydraulic pressure, motor load, job progress |

The simulation engine (`backend/src/simulation.js`) uses real physical
relationships: motor load is driven by commanded speed + spray back-pressure +
surface drag; temperature integrates toward a load-dependent equilibrium with
Newtonian cooling; battery drains as a function of instantaneous power draw;
faults are triggered by genuine threshold crossings in the model. Nothing is a
random gauge jitter dressed up as telemetry.

---

## Run it

```bash
cd emma-console
npm run install:all      # installs backend + frontend deps
npm run dev              # starts backend (:4000) + frontend (:5173) together
```

Then open **http://localhost:5173**. Sign in on the login screen (any name works).

Run pieces individually:

```bash
npm run backend          # Express + WebSocket on :4000
npm run frontend         # Vite dev server on :5173 (proxies /api + /ws to :4000)
npm run build            # production build of the frontend
```

---

## Features

- **Dashboard** — live stat cards (battery, motor temp, pressure, load, speed,
  spray, CPU, connection health), simulated moving-factory-floor camera with
  position/obstacle/task/safety overlays, control panel, job panel, fault panel.
- **Robot View** — interactive 3D articulated arm (rotate / zoom / pan), joints
  animate while running, colour reflects health (green / yellow / red).
- **Control** — large glove-friendly buttons: Start, Pause, Resume, Emergency
  Stop, Return Home, Reset Faults; speed & spray sliders that immediately change
  simulated behaviour.
- **Diagnostics** — real host CPU/memory/latency/uptime + modelled motor/hydraulic
  charts updating every second, subsystem status grid, host controller info.
- **Fault detection** — motor overheat, low pressure, camera offline, E-Stop,
  comms lost, obstacle, low battery. Each has severity, description, timestamp,
  recommended action, and operator acknowledgement (persists until Reset Faults).
- **History** — searchable / filterable event log (category + severity).
- **Settings** — dark/light theme, metric/imperial units, animation speed,
  refresh rate, operator name.
- **Bonus** — login screen, operator badge, system health score, connection
  quality indicator, downloadable **PDF session report**, keyboard shortcuts
  (`Enter` = Start/Resume, `Space` = Pause, `Esc` = Emergency Stop).

---

## API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/robot` | full telemetry snapshot (robot + live system) |
| GET | `/api/diagnostics` | host metrics, subsystem health, metrics history |
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
emma-console/
├── backend/src/
│   ├── server.js          Express REST + WebSocket + 1 Hz sim loop
│   ├── simulation.js      physics-coherent robot model + faults
│   └── systemMetrics.js   REAL host telemetry (os/process)
└── frontend/src/
    ├── components/        Header, Sidebar, StatCard, RobotArm3D, CameraPanel,
    │                      ControlPanel, JobPanel, FaultPanel, Login, Icons
    ├── pages/             Dashboard, RobotView, Diagnostics, History, Settings
    ├── lib/               useTelemetry (WS), settings, types, status, report (PDF)
    └── App.tsx            routing, shortcuts, E-Stop banner
```
