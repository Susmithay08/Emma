import { jsPDF } from 'jspdf';
import type { Telemetry } from './types';
import { fmtDuration } from './settings';

// Generate a downloadable session report PDF from the current telemetry snapshot.
export function generateReport(tel: Telemetry, latency: number, operator: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const r = tel.robot;
  const s = tel.system;
  let y = 56;

  // Header band
  doc.setFillColor(255, 107, 26);
  doc.rect(0, 0, W, 8, 'F');
  doc.setTextColor(20, 27, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('EMMA Operator Console', 40, y);
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 130);
  doc.setFont('helvetica', 'normal');
  doc.text('Session Report — Robotic Surface Preparation System', 40, (y += 18));
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, (y += 15));
  doc.text(`Operator: ${operator}`, 40, (y += 15));

  y += 20;
  const section = (title: string) => {
    doc.setFillColor(245, 246, 249);
    doc.rect(40, y - 12, W - 80, 22, 'F');
    doc.setTextColor(255, 107, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 48, y + 3);
    y += 26;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 48);
  };
  const row = (label: string, value: string, tag?: string) => {
    doc.setTextColor(90, 90, 100);
    doc.text(label, 48, y);
    doc.setTextColor(20, 20, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 250, y);
    doc.setFont('helvetica', 'normal');
    if (tag) {
      doc.setTextColor(tag === 'LIVE' ? 34 : 56, tag === 'LIVE' ? 197 : 130, tag === 'LIVE' ? 94 : 246);
      doc.setFontSize(8);
      doc.text(tag, 470, y);
      doc.setFontSize(11);
    }
    y += 18;
  };

  section('Robot Status');
  row('Status', r.status.toUpperCase());
  row('Mode', r.mode);
  row('Health', r.health.toUpperCase());
  row('Uptime', fmtDuration(r.uptimeSec));

  section('Telemetry Snapshot');
  row('Battery', `${r.battery.toFixed(1)} %`, 'SIM');
  row('Motor Temperature', `${r.motorTempC.toFixed(1)} °C`, 'SIM');
  row('Hydraulic Pressure', `${r.hydraulicPressureBar} bar`, 'SIM');
  row('Motor Load', `${r.motorLoadPercent} %`, 'SIM');
  row('Robot Speed', `${r.actualSpeed} % (setpoint ${r.commandedSpeed} %)`, 'SIM');
  row('Spray Intensity', `${r.sprayIntensity} %`, 'SIM');

  section('Current Job');
  row('Job Name', r.job.name);
  row('Completion', `${r.job.completionPercent.toFixed(1)} %`);
  row('Surface Area', `${r.job.completedM2.toFixed(1)} / ${r.job.surfaceAreaM2} m²`);
  row('ETA', fmtDuration(r.job.etaSeconds));
  row('Current Step', r.job.currentStep);

  section('Host Controller (Live Metrics)');
  row('Platform', s.platform, 'LIVE');
  row('CPU Usage', `${s.cpuPercent.toFixed(1)} %`, 'LIVE');
  row('Memory', `${s.memory.usedMB} / ${s.memory.totalMB} MB (${s.memory.usedPercent}%)`, 'LIVE');
  row('Network Latency', `${latency} ms`, 'LIVE');
  row('Node Version', s.nodeVersion, 'LIVE');

  if (r.faults.length) {
    section('Active Faults');
    r.faults.forEach((f) => row(f.title, `${f.severity.toUpperCase()} — ${f.acknowledged ? 'ACK' : 'UNACK'}`));
  }

  doc.setTextColor(150, 150, 158);
  doc.setFontSize(9);
  doc.text(
    'EMMA Operator Console v1.0.0 · Simulation build · LIVE = real host telemetry, SIM = physics-modelled',
    40,
    doc.internal.pageSize.getHeight() - 30
  );

  doc.save(`EMMA-session-report-${Date.now()}.pdf`);
}
