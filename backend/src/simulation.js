// simulation.js
// Physically-coherent model of the EMMA robotic surface-prep cell.
// This is a SIMULATION (no hardware attached) but values are derived from a
// consistent physical model — not Math.random() noise. Relationships:
//   - motor load is driven by commanded speed + spray intensity + surface drag
//   - motor temperature integrates toward an equilibrium set by load (heating)
//     and cools toward ambient when idle (Newtonian cooling)
//   - hydraulic pressure tracks load with bounded fluctuation
//   - battery drains as a function of instantaneous power draw (load * speed)
//   - job completion integrates actual traversal speed over surface area
// All faults are triggered by threshold crossings in the model, plus rare
// stochastic hardware events (bearing wear, comms glitch) at realistic rates.

const AMBIENT_C = 22;
const TICK_MS = 1000;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Deterministic-ish small perturbation so gauges "breathe" like real sensors
// (sensor quantisation / electrical noise), seeded by time so it's smooth.
function sensorNoise(seed, amp) {
  return (Math.sin(seed * 0.7) + Math.sin(seed * 1.31 + 1.7)) * 0.5 * amp;
}

// Persistent obstacles that sit on the work surface at fixed spots. The robot
// meets them as it advances and clears each one before continuing.
function makeObstacles() {
  return [
    { id: 1, atPercent: 26, type: 'crate', state: 'ahead' },
    { id: 2, atPercent: 54, type: 'toolbox', state: 'ahead' },
    { id: 3, atPercent: 79, type: 'cone', state: 'ahead' },
  ];
}

export function resetObstacles(state) {
  state.obstacles = makeObstacles();
  state.clearing = null;
}

export function createInitialState() {
  return {
    status: 'idle', // idle | running | paused | estop | returning | homing
    mode: 'Automatic', // Automatic | Manual | Maintenance
    battery: 100,
    motorTempC: AMBIENT_C,
    hydraulicPressureBar: 8, // idle standby pressure
    motorLoadPercent: 0,
    commandedSpeed: 60, // operator setpoint 0-100
    actualSpeed: 0,
    sprayIntensity: 45, // operator setpoint 0-100
    position: { x: 0, y: 0, z: 0 }, // metres on the work cell floor
    heading: 0,
    joints: [0, 0.2, -0.4, 0], // radians: base, shoulder, elbow, wrist
    job: {
      name: 'A320 Fuselage Panel — Coating Removal',
      surfaceAreaM2: 42.5,
      completedM2: 0,
      completionPercent: 0,
      etaSeconds: null,
      currentStep: 'Awaiting start',
      steps: [
        'Awaiting start',
        'Homing & calibration',
        'Surface scan',
        'Coarse strip pass',
        'Fine finishing pass',
        'Quality verification',
        'Return to dock',
        'Complete',
      ],
      stepIndex: 0,
    },
    faults: [],
    obstacles: makeObstacles(),
    clearing: null, // { id, ticksLeft } while pushing an obstacle aside
    tick: 0,
    uptimeSec: 0,
    lastStartedAt: null,
  };
}

let faultIdCounter = 1;

const FAULT_CATALOG = {
  MOTOR_OVERHEAT: {
    code: 'MOTOR_OVERHEAT',
    severity: 'critical',
    title: 'Motor Overheating',
    description: 'Servo motor temperature exceeded the safe operating limit.',
    action: 'Reduce speed setpoint and allow motor to cool below 70°C before resuming.',
  },
  LOW_HYD_PRESSURE: {
    code: 'LOW_HYD_PRESSURE',
    severity: 'warning',
    title: 'Low Hydraulic Pressure',
    description: 'Hydraulic supply pressure dropped below the working threshold.',
    action: 'Check hydraulic reservoir level and inspect for line leaks.',
  },
  CAMERA_OFFLINE: {
    code: 'CAMERA_OFFLINE',
    severity: 'warning',
    title: 'Camera Offline',
    description: 'Vision system stopped reporting frames.',
    action: 'Power-cycle the vision module; verify Ethernet link to camera head.',
  },
  ESTOP: {
    code: 'ESTOP',
    severity: 'critical',
    title: 'Emergency Stop Triggered',
    description: 'Emergency stop circuit opened. All motion halted.',
    action: 'Clear the hazard, release the E-Stop, then Reset Faults to re-enable motion.',
  },
  COMMS_LOST: {
    code: 'COMMS_LOST',
    severity: 'critical',
    title: 'Communication Lost',
    description: 'Robot controller heartbeat missed. Link degraded.',
    action: 'Check network switch and controller PSU. Motion inhibited until link restored.',
  },
  OBSTACLE: {
    code: 'OBSTACLE',
    severity: 'warning',
    title: 'Obstacle Detected',
    description: 'LiDAR detected an obstruction inside the protected work envelope.',
    action: 'Clear the work cell of personnel/objects, then acknowledge to continue.',
  },
  LOW_BATTERY: {
    code: 'LOW_BATTERY',
    severity: 'warning',
    title: 'Low Battery',
    description: 'Onboard battery charge is critically low.',
    action: 'Return robot to dock for charging.',
  },
};

function raiseFault(state, key, log) {
  if (state.faults.some((f) => f.code === key && !f.cleared)) return; // dedupe
  const def = FAULT_CATALOG[key];
  const fault = {
    id: faultIdCounter++,
    ...def,
    timestamp: Date.now(),
    acknowledged: false,
    cleared: false,
  };
  state.faults.unshift(fault);
  log?.({ category: 'Fault', severity: def.severity, message: `${def.title}: ${def.description}` });
}

// Advance the model one tick. `log(event)` records to event history.
export function step(state, log) {
  state.tick++;
  state.uptimeSec++;

  const running = state.status === 'running';
  const paused = state.status === 'paused';
  const estop = state.status === 'estop';
  const homing = state.status === 'homing' || state.status === 'returning';

  const hasCriticalFault = state.faults.some(
    (f) => !f.cleared && f.severity === 'critical' && f.code !== 'OBSTACLE'
  );

  // ---- Target motion state ---------------------------------------------
  let targetSpeed = 0;
  if (estop || hasCriticalFault) {
    targetSpeed = 0;
  } else if (running) {
    targetSpeed = state.commandedSpeed;
  } else if (homing) {
    targetSpeed = 35; // fixed transit speed when returning home
  }

  // actualSpeed ramps toward target (inertia)
  const accel = 8; // %/s
  if (state.actualSpeed < targetSpeed) {
    state.actualSpeed = clamp(state.actualSpeed + accel, 0, targetSpeed);
  } else {
    state.actualSpeed = clamp(state.actualSpeed - accel * 1.5, targetSpeed, 100);
  }

  const speedFrac = state.actualSpeed / 100;
  const sprayFrac = state.sprayIntensity / 100;

  // ---- Motor load: driven by speed, spray back-pressure, surface drag ---
  if (state.actualSpeed > 0.5) {
    const surfaceDrag = 0.15 + 0.1 * Math.sin(state.tick * 0.2); // varying material
    const targetLoad =
      (35 * speedFrac + 30 * speedFrac * sprayFrac + 100 * surfaceDrag * speedFrac);
    state.motorLoadPercent += (targetLoad - state.motorLoadPercent) * 0.25;
  } else {
    state.motorLoadPercent += (0 - state.motorLoadPercent) * 0.3;
  }
  state.motorLoadPercent = clamp(state.motorLoadPercent + sensorNoise(state.tick, 1.2), 0, 100);

  // ---- Motor temperature: heat from load, Newtonian cooling to ambient --
  const loadFrac = state.motorLoadPercent / 100;
  const heatEquilibrium = AMBIENT_C + 68 * loadFrac; // full load ~= 90°C
  const thermalRate = state.motorTempC < heatEquilibrium ? 0.08 : 0.05;
  state.motorTempC += (heatEquilibrium - state.motorTempC) * thermalRate;
  state.motorTempC = clamp(state.motorTempC + sensorNoise(state.tick * 1.3, 0.3), AMBIENT_C - 1, 130);

  // ---- Hydraulic pressure: tracks load, standby when idle ---------------
  const targetPressure = state.actualSpeed > 0.5 ? 120 + 40 * loadFrac : 8;
  state.hydraulicPressureBar += (targetPressure - state.hydraulicPressureBar) * 0.3;
  state.hydraulicPressureBar = clamp(
    state.hydraulicPressureBar + sensorNoise(state.tick * 0.9, 2.5),
    0,
    220
  );

  // ---- Battery: drains with power draw; trickle when idle ---------------
  if (estop) {
    // frozen — no meaningful draw
  } else if (state.actualSpeed > 0.5) {
    const powerDraw = 0.008 + 0.05 * speedFrac * (0.4 + loadFrac) + 0.02 * sprayFrac;
    state.battery = clamp(state.battery - powerDraw, 0, 100);
  } else {
    state.battery = clamp(state.battery - 0.002, 0, 100); // idle standby drain
  }

  // ---- Position + joints: sweep across the work surface -----------------
  // Gate on `running` (not raw speed) so pause/estop freeze motion instantly
  // instead of coasting while the speed gauge decays.
  if (running && !homing) {
    const travel = speedFrac * 0.05;
    state.position.x += Math.cos(state.heading) * travel;
    state.position.y += Math.sin(state.heading) * travel;
    // serpentine raster: turn at edges
    if (Math.abs(state.position.x) > 3) {
      state.heading += Math.PI / 2;
      state.position.x = clamp(state.position.x, -3, 3);
    }
    // animate arm joints along a smooth sweep
    const t = state.tick * 0.08 * speedFrac;
    state.joints = [
      Math.sin(t) * 0.9,
      0.35 + Math.sin(t * 0.7) * 0.4,
      -0.6 + Math.cos(t * 0.5) * 0.5,
      Math.sin(t * 1.3) * 0.7,
    ];
  } else if (homing) {
    // ease joints + position back to dock
    state.joints = state.joints.map((j) => j * 0.9);
    state.position.x *= 0.9;
    state.position.y *= 0.9;
    if (Math.abs(state.position.x) < 0.05 && Math.abs(state.position.y) < 0.05) {
      state.status = 'idle';
      state.job.currentStep = 'At dock';
      log?.({ category: 'Motion', severity: 'info', message: 'Robot returned to dock.' });
    }
  }

  // ---- Obstacle detection & clearing -----------------------------------
  // While painting, the robot watches the path ahead. When it reaches an
  // obstacle it stops painting, spends a few ticks pushing it aside, then
  // resumes. Coverage is frozen for the duration.
  if (running) {
    if (state.clearing) {
      state.clearing.ticksLeft--;
      const ob = state.obstacles.find((o) => o.id === state.clearing.id);
      if (ob) ob.state = 'clearing';
      if (state.clearing.ticksLeft <= 0) {
        if (ob) ob.state = 'cleared';
        state.clearing = null;
        state.job.currentStep = 'Path clear — resuming surface prep';
        log?.({
          category: 'Motion',
          severity: 'success',
          message: `Obstacle moved aside (${ob?.type}). Resuming.`,
        });
      } else {
        state.job.currentStep = 'Obstacle detected — moving aside';
      }
    } else {
      const blocking = state.obstacles.find(
        (o) => o.state !== 'cleared' && state.job.completionPercent >= o.atPercent - 0.5
      );
      if (blocking) {
        state.clearing = { id: blocking.id, ticksLeft: 4 };
        blocking.state = 'clearing';
        state.job.currentStep = 'Obstacle detected — moving aside';
        log?.({
          category: 'Safety',
          severity: 'warning',
          message: `Obstacle detected at ${blocking.atPercent}% (${blocking.type}) — clearing path.`,
        });
      }
    }
  }

  // ---- Job progress: integrate coverage over surface area ---------------
  if (running && !hasCriticalFault && !state.clearing) {
    const coverageRate = speedFrac * (0.6 + 0.4 * sprayFrac) * 0.12; // m²/s
    state.job.completedM2 = clamp(
      state.job.completedM2 + coverageRate,
      0,
      state.job.surfaceAreaM2
    );
    state.job.completionPercent =
      Math.round((state.job.completedM2 / state.job.surfaceAreaM2) * 1000) / 10;

    // step progression by completion band
    const pct = state.job.completionPercent;
    const idx =
      pct >= 100 ? 7 : pct > 85 ? 5 : pct > 25 ? 4 : pct > 5 ? 3 : pct > 0 ? 2 : 1;
    if (idx !== state.job.stepIndex) {
      state.job.stepIndex = idx;
      state.job.currentStep = state.job.steps[idx];
      log?.({ category: 'Job', severity: 'info', message: `Step: ${state.job.currentStep}` });
    }

    const remainingM2 = state.job.surfaceAreaM2 - state.job.completedM2;
    state.job.etaSeconds = coverageRate > 0.0001 ? Math.round(remainingM2 / coverageRate) : null;

    if (state.job.completionPercent >= 100) {
      state.status = 'idle';
      state.actualSpeed = 0;
      state.job.currentStep = 'Complete';
      state.job.stepIndex = 7;
      state.job.etaSeconds = 0;
      log?.({ category: 'Job', severity: 'success', message: `Job complete: ${state.job.name}` });
    }
  }

  // ---- Fault detection from model thresholds ---------------------------
  if (state.motorTempC > 95) raiseFault(state, 'MOTOR_OVERHEAT', log);
  if (state.actualSpeed > 0.5 && state.hydraulicPressureBar < 60)
    raiseFault(state, 'LOW_HYD_PRESSURE', log);
  if (state.battery < 15) raiseFault(state, 'LOW_BATTERY', log);

  // ---- Rare stochastic hardware events (realistic MTBF) ----------------
  if (running) {
    if (Math.random() < 0.0015) raiseFault(state, 'CAMERA_OFFLINE', log);
    if (Math.random() < 0.001) raiseFault(state, 'COMMS_LOST', log);
  }

  // ---- Health rollup ---------------------------------------------------
  const active = state.faults.filter((f) => !f.cleared);
  if (estop || active.some((f) => f.severity === 'critical')) state.health = 'fault';
  else if (active.length > 0 || state.motorTempC > 80 || state.battery < 25)
    state.health = 'warning';
  else state.health = 'healthy';

  return state;
}

// ---- Operator commands ---------------------------------------------------
export function applyControl(state, action, log) {
  switch (action) {
    case 'start':
      if (state.status === 'estop') return { ok: false, error: 'Clear E-Stop and reset faults first.' };
      if (state.faults.some((f) => !f.cleared && f.severity === 'critical'))
        return { ok: false, error: 'Critical fault active. Reset faults first.' };
      if (state.job.completionPercent >= 100) {
        state.job.completedM2 = 0;
        state.job.completionPercent = 0;
        state.job.stepIndex = 1;
        resetObstacles(state);
      }
      state.status = 'running';
      state.lastStartedAt = Date.now();
      state.job.currentStep = state.job.steps[Math.max(1, state.job.stepIndex)];
      log?.({ category: 'Control', severity: 'success', message: 'Robot started.' });
      return { ok: true };
    case 'pause':
      if (state.status === 'running') {
        state.status = 'paused';
        log?.({ category: 'Control', severity: 'info', message: 'Robot paused.' });
      }
      return { ok: true };
    case 'resume':
      if (state.status === 'paused') {
        state.status = 'running';
        log?.({ category: 'Control', severity: 'info', message: 'Robot resumed.' });
      }
      return { ok: true };
    case 'estop':
      state.status = 'estop';
      state.actualSpeed = 0;
      raiseFault(state, 'ESTOP', log);
      log?.({ category: 'Safety', severity: 'critical', message: 'EMERGENCY STOP activated.' });
      return { ok: true };
    case 'home':
      if (state.status === 'estop') return { ok: false, error: 'Clear E-Stop first.' };
      state.status = 'returning';
      state.job.currentStep = 'Returning to dock';
      log?.({ category: 'Motion', severity: 'info', message: 'Return-to-home commanded.' });
      return { ok: true };
    default:
      return { ok: false, error: 'Unknown action' };
  }
}

export function setSetpoint(state, key, value) {
  const v = clamp(Number(value) || 0, 0, 100);
  if (key === 'speed') state.commandedSpeed = v;
  if (key === 'spray') state.sprayIntensity = v;
  return { ok: true };
}

export function acknowledgeFault(state, id, log) {
  const f = state.faults.find((x) => x.id === id);
  if (f) {
    f.acknowledged = true;
    log?.({ category: 'Fault', severity: 'info', message: `Fault acknowledged: ${f.title}` });
  }
  return { ok: true };
}

export function resetFaults(state, log) {
  const cleared = state.faults.filter((f) => !f.cleared).length;
  state.faults.forEach((f) => (f.cleared = true));
  if (state.status === 'estop') state.status = 'idle';
  state.health = 'healthy';
  log?.({ category: 'Control', severity: 'success', message: `Faults reset (${cleared} cleared).` });
  return { ok: true };
}
