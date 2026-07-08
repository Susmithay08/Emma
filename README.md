# RoboOps Console — AVA Operator Console

**🔴 Live demo → https://roboops-console.onrender.com/**

> Hosted on Render's free tier, so the first load after it's been idle may take
> ~30–60s to wake up.

RoboOps Console is a full-stack Human–Machine Interface (HMI) built to simulate
the software used to operate industrial robotic systems. It demonstrates
**real-time telemetry, operator controls, safety workflows, and 3D
visualization** using modern web technologies — and runs end-to-end with no
physical hardware.

**Stack:** React · TypeScript · Tailwind CSS · React Three Fiber (Three.js) ·
Node.js · Express · WebSocket (`ws`) · Vite. Deployed as a single Node service on
Render (the backend serves the built frontend, REST API and WebSocket from one
origin).

---

## Architecture

```
                    Browser
          React + TypeScript
                  │
          WebSocket + REST
                  │
          Express / Node.js
                  │
     Simulation Engine (Robot)
                  │
  Telemetry • Fault Engine • Jobs
```

The browser holds **no business logic** — it renders the operator UI and 3D
scenes, receives a full telemetry snapshot over a WebSocket at **1 Hz**, and
issues operator commands over REST. The **Express server owns all state**: a
deterministic simulation engine advances the robot model every tick, a fault
engine evaluates threshold crossings, and a job system tracks surface-prep
progress. Real host metrics (`os` / `process`) are merged into the same
telemetry stream and tagged separately from simulated values (see below).

---

## Data model — simulated vs. live

There is no physical robot attached, so a battery or hydraulic sensor cannot be
literally read. Every value carries its provenance, badged **LIVE** or **SIM**
throughout the UI:

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

## Engineering challenges

- **Synchronizing robot state across multiple UI panels** — a single 1 Hz
  telemetry snapshot is the one source of truth, so the dashboard, both 3D
  scenes, the controls and the stats drawer stay consistent without local copies
  drifting out of sync.
- **Creating believable robot movement with inverse kinematics** — the
  surface-prep arm is driven by 2-link IK so the tool tip lands exactly on the
  work surface, instead of hand-animated poses that clip through or float off it.
- **Separating simulated telemetry from live machine metrics** — host readings
  (CPU, memory, latency, uptime) are genuinely measured and badged `LIVE`, while
  physics-modelled robot values are badged `SIM`; the two are never conflated.
- **Designing an operator interface usable with touch input** — large hit
  targets, glove-friendly controls, an auto-hiding nav rail, and keyboard
  shortcuts for the safety-critical actions.
- **A fault engine driven by threshold crossings, not random events** — faults
  are raised when the model crosses real limits (e.g. motor temp > 95 °C, low
  hydraulic pressure under load, low battery), with de-duplication,
  acknowledgement and reset.

---

## Future improvements

- **ROS 2 integration** — drive real robot nodes instead of the simulation
- **MQTT** and **OPC-UA** support for industrial messaging
- **PLC integration**
- **Multiple robots / fleet control**
- **Live camera streaming** (WebRTC)
- **Historical telemetry database** (time-series storage & replay)
- **Predictive maintenance** and **AI anomaly detection**
- **Mobile / tablet operator mode**

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
