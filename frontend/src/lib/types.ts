export type Health = 'healthy' | 'warning' | 'fault';
export type RobotStatus = 'idle' | 'running' | 'paused' | 'estop' | 'returning' | 'homing';

export interface Fault {
  id: number;
  code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action: string;
  timestamp: number;
  acknowledged: boolean;
  cleared: boolean;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  ttl: number;
}

export interface Job {
  name: string;
  surfaceAreaM2: number;
  completedM2: number;
  completionPercent: number;
  etaSeconds: number | null;
  currentStep: string;
  steps: string[];
  stepIndex: number;
}

export interface Robot {
  status: RobotStatus;
  mode: string;
  health: Health;
  battery: number;
  motorTempC: number;
  hydraulicPressureBar: number;
  motorLoadPercent: number;
  commandedSpeed: number;
  actualSpeed: number;
  sprayIntensity: number;
  position: { x: number; y: number; z: number };
  heading: number;
  joints: number[];
  job: Job;
  faults: Fault[];
  obstacles: Obstacle[];
  uptimeSec: number;
}

export interface SystemMetrics {
  cpuPercent: number;
  memory: {
    totalMB: number;
    usedMB: number;
    usedPercent: number;
    processHeapMB: number;
    processRssMB: number;
  };
  loadAvg: number[];
  cores: number;
  platform: string;
  hostname: string;
  nodeVersion: string;
  processUptimeSec: number;
  hostUptimeSec: number;
  serverUptimeSec: number;
  timestamp: number;
}

export interface Telemetry {
  type: string;
  robot: Robot;
  system: SystemMetrics;
  timestamp: number;
}

export interface HistoryEvent {
  id: number;
  timestamp: number;
  category: string;
  severity: string;
  message: string;
}
