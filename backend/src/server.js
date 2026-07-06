// server.js — Express REST + WebSocket live telemetry for EMMA Operator Console
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import {
  createInitialState,
  step,
  applyControl,
  setSetpoint,
  acknowledgeFault,
  resetFaults,
} from './simulation.js';
import { getSystemMetrics } from './systemMetrics.js';

const PORT = process.env.PORT || 4000;

const state = createInitialState();

// ---- Event history (ring buffer) ----------------------------------------
const history = [];
let eventId = 1;
function log(evt) {
  const entry = {
    id: eventId++,
    timestamp: Date.now(),
    category: evt.category || 'System',
    severity: evt.severity || 'info',
    message: evt.message,
  };
  history.unshift(entry);
  if (history.length > 500) history.pop();
  return entry;
}
log({ category: 'System', severity: 'info', message: 'EMMA control server initialised.' });
log({ category: 'Auth', severity: 'info', message: 'Operator session ready.' });

// ---- Diagnostics history for charts (real system metrics over time) -----
const metricsHistory = []; // { t, cpu, mem, tempC, load, pressure, battery, latencyMs }
function pushMetricsHistory(sys) {
  metricsHistory.push({
    t: Date.now(),
    cpu: sys.cpuPercent,
    mem: sys.memory.usedPercent,
    tempC: Math.round(state.motorTempC * 10) / 10,
    load: Math.round(state.motorLoadPercent),
    pressure: Math.round(state.hydraulicPressureBar),
    battery: Math.round(state.battery * 10) / 10,
    latencyMs: lastLatencyMs,
  });
  if (metricsHistory.length > 120) metricsHistory.shift();
}

let lastLatencyMs = 0;

function buildSnapshot() {
  const sys = getSystemMetrics();
  return {
    type: 'telemetry',
    robot: {
      status: state.status,
      mode: state.mode,
      health: state.health,
      battery: Math.round(state.battery * 10) / 10,
      motorTempC: Math.round(state.motorTempC * 10) / 10,
      hydraulicPressureBar: Math.round(state.hydraulicPressureBar),
      motorLoadPercent: Math.round(state.motorLoadPercent),
      commandedSpeed: state.commandedSpeed,
      actualSpeed: Math.round(state.actualSpeed),
      sprayIntensity: state.sprayIntensity,
      position: {
        x: Math.round(state.position.x * 100) / 100,
        y: Math.round(state.position.y * 100) / 100,
        z: Math.round(state.position.z * 100) / 100,
      },
      heading: Math.round(state.heading * 100) / 100,
      joints: state.joints.map((j) => Math.round(j * 1000) / 1000),
      job: state.job,
      faults: state.faults.filter((f) => !f.cleared),
      obstacles: state.obstacles,
      uptimeSec: state.uptimeSec,
    },
    system: sys, // REAL host metrics
    timestamp: Date.now(),
  };
}

// ---- Express app ---------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: state.uptimeSec }));

app.get('/api/robot', (_req, res) => res.json(buildSnapshot()));

app.get('/api/diagnostics', (_req, res) => {
  res.json({
    system: getSystemMetrics(),
    robotUptimeSec: state.uptimeSec,
    latencyMs: lastLatencyMs,
    metricsHistory,
    subsystems: {
      motor: state.motorTempC > 95 ? 'fault' : state.motorTempC > 80 ? 'warning' : 'ok',
      hydraulic:
        state.hydraulicPressureBar < 60 && state.actualSpeed > 1 ? 'warning' : 'ok',
      vision: state.faults.some((f) => !f.cleared && f.code === 'CAMERA_OFFLINE')
        ? 'fault'
        : 'ok',
      comms: state.faults.some((f) => !f.cleared && f.code === 'COMMS_LOST') ? 'fault' : 'ok',
      battery: state.battery < 15 ? 'warning' : 'ok',
      sensors: 'ok',
    },
  });
});

app.get('/api/history', (req, res) => {
  const { q, category, severity } = req.query;
  let out = history;
  if (q) out = out.filter((e) => e.message.toLowerCase().includes(String(q).toLowerCase()));
  if (category && category !== 'all') out = out.filter((e) => e.category === category);
  if (severity && severity !== 'all') out = out.filter((e) => e.severity === severity);
  res.json({ events: out.slice(0, 200), total: history.length });
});

app.post('/api/control', (req, res) => {
  const { action, setpoint } = req.body || {};
  let result;
  if (setpoint) {
    result = setSetpoint(state, setpoint.key, setpoint.value);
  } else {
    result = applyControl(state, action, log);
  }
  broadcast(buildSnapshot());
  res.json(result);
});

app.post('/api/reset', (_req, res) => {
  const r = resetFaults(state, log);
  broadcast(buildSnapshot());
  res.json(r);
});

app.post('/api/fault/ack', (req, res) => {
  const r = acknowledgeFault(state, Number(req.body?.id), log);
  broadcast(buildSnapshot());
  res.json(r);
});

app.post('/api/job/start', (req, res) => {
  const { name, surfaceAreaM2 } = req.body || {};
  if (name) state.job.name = name;
  if (surfaceAreaM2) state.job.surfaceAreaM2 = Number(surfaceAreaM2);
  state.job.completedM2 = 0;
  state.job.completionPercent = 0;
  state.job.stepIndex = 1;
  const r = applyControl(state, 'start', log);
  broadcast(buildSnapshot());
  res.json(r);
});

app.post('/api/login', (req, res) => {
  const { operator } = req.body || {};
  log({ category: 'Auth', severity: 'success', message: `Operator login: ${operator || 'Unknown'}` });
  res.json({ ok: true, operator, token: 'sim-' + Date.now() });
});

// ---- HTTP + WebSocket ----------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

wss.on('connection', (ws) => {
  log({ category: 'System', severity: 'info', message: 'HMI client connected.' });
  ws.send(JSON.stringify(buildSnapshot()));

  // Round-trip latency measurement (REAL, measured)
  ws.on('message', (raw) => {
    try {
      const m = JSON.parse(raw.toString());
      if (m.type === 'ping') {
        lastLatencyMs = Math.max(0, Date.now() - m.t);
        ws.send(JSON.stringify({ type: 'pong', t: m.t, latencyMs: lastLatencyMs }));
      }
    } catch {
      /* ignore */
    }
  });

  ws.on('close', () =>
    log({ category: 'System', severity: 'info', message: 'HMI client disconnected.' })
  );
});

// ---- Simulation loop: 1 Hz -----------------------------------------------
setInterval(() => {
  step(state, log);
  const sys = getSystemMetrics();
  pushMetricsHistory(sys);
  broadcast(buildSnapshot());
}, 1000);

server.listen(PORT, () => {
  console.log(`\n  EMMA control server → http://localhost:${PORT}`);
  console.log(`  WebSocket telemetry → ws://localhost:${PORT}/ws\n`);
});
