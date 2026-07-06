// systemMetrics.js
// REAL, LIVE system telemetry read from the actual host machine.
// Nothing here is fabricated: values come from Node's `os` and `process`.

import os from 'node:os';

let lastCpu = os.cpus();
let lastCpuTime = Date.now();

// Compute real host CPU utilisation by diffing /proc-style cpu tick counters.
function sampleCpuPercent() {
  const now = os.cpus();
  let idleDiff = 0;
  let totalDiff = 0;

  for (let i = 0; i < now.length; i++) {
    const a = lastCpu[i]?.times;
    const b = now[i].times;
    if (!a) continue;
    const aTotal = a.user + a.nice + a.sys + a.idle + a.irq;
    const bTotal = b.user + b.nice + b.sys + b.idle + b.irq;
    idleDiff += b.idle - a.idle;
    totalDiff += bTotal - aTotal;
  }

  lastCpu = now;
  lastCpuTime = Date.now();

  if (totalDiff <= 0) return 0;
  const usage = (1 - idleDiff / totalDiff) * 100;
  return Math.max(0, Math.min(100, usage));
}

const startTime = Date.now();

export function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const load = os.loadavg(); // [1m, 5m, 15m] — real on POSIX, 0 on Windows
  const proc = process.memoryUsage();

  return {
    cpuPercent: Math.round(sampleCpuPercent() * 10) / 10,
    memory: {
      totalMB: Math.round(totalMem / 1024 / 1024),
      usedMB: Math.round(usedMem / 1024 / 1024),
      usedPercent: Math.round((usedMem / totalMem) * 1000) / 10,
      processHeapMB: Math.round(proc.heapUsed / 1024 / 1024),
      processRssMB: Math.round(proc.rss / 1024 / 1024),
    },
    loadAvg: load.map((n) => Math.round(n * 100) / 100),
    cores: os.cpus().length,
    platform: `${os.type()} ${os.release()} (${os.arch()})`,
    hostname: os.hostname(),
    nodeVersion: process.version,
    processUptimeSec: Math.round(process.uptime()),
    hostUptimeSec: Math.round(os.uptime()),
    serverUptimeSec: Math.round((Date.now() - startTime) / 1000),
    timestamp: Date.now(),
  };
}
