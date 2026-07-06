import { useEffect, useRef, useState, useCallback } from 'react';
import type { Telemetry } from './types';

type ConnState = 'connecting' | 'online' | 'offline';

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [conn, setConn] = useState<ConnState>('connecting');
  const [latency, setLatency] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<number>(0);

  useEffect(() => {
    let closed = false;
    let reconnectTimer: number | undefined;

    function connect() {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      wsRef.current = ws;
      setConn('connecting');

      ws.onopen = () => {
        setConn('online');
        // measure REAL round-trip latency every 2s
        const ping = () => {
          if (ws.readyState === 1) {
            pingRef.current = Date.now();
            ws.send(JSON.stringify({ type: 'ping', t: pingRef.current }));
          }
        };
        ping();
        const pingInterval = window.setInterval(ping, 2000);
        (ws as any)._pingInterval = pingInterval;
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'pong') {
            setLatency(Date.now() - data.t);
          } else if (data.type === 'telemetry') {
            setTelemetry(data);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setConn('offline');
        window.clearInterval((ws as any)._pingInterval);
        if (!closed) reconnectTimer = window.setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      closed = true;
      window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  return { telemetry, conn, latency };
}

// REST command helpers
export async function sendControl(action?: string, setpoint?: { key: string; value: number }) {
  const res = await fetch('/api/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, setpoint }),
  });
  return res.json();
}

export async function resetFaults() {
  return (await fetch('/api/reset', { method: 'POST' })).json();
}

export async function ackFault(id: number) {
  return (
    await fetch('/api/fault/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  ).json();
}

export async function startJob(name?: string, surfaceAreaM2?: number) {
  return (
    await fetch('/api/job/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, surfaceAreaM2 }),
    })
  ).json();
}

export function useDebouncedControl() {
  const timers = useRef<Record<string, number>>({});
  return useCallback((key: string, value: number) => {
    window.clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(() => {
      sendControl(undefined, { key, value });
    }, 60);
  }, []);
}
