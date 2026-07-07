import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { Robot } from '../lib/types';

const PANEL_W = 8;
const PANEL_H = 2.4;
const PANEL_Y = 0.5;
const HALF = PANEL_W / 2;

function healthColor(h: string) {
  return h === 'fault' ? '#ff6b6b' : h === 'warning' ? '#ffb020' : '#35e17f';
}

// The workpiece: corroded slab with a bright "cleaned" region that grows L→R.
function Panel({ robotRef }: { robotRef: React.MutableRefObject<Robot> }) {
  const clean = useRef<THREE.Mesh>(null!);
  const edge = useRef<THREE.Mesh>(null!);
  const edgeMat = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame(() => {
    const r = robotRef.current;
    const frac = Math.max(0.0001, r.job.completionPercent / 100);
    if (clean.current) {
      clean.current.scale.x = frac;
      clean.current.position.x = -HALF + (frac * PANEL_W) / 2;
    }
    const painting = r.status === 'running' && !r.obstacles.some((o) => o.state === 'clearing');
    if (edge.current) {
      edge.current.position.x = -HALF + frac * PANEL_W;
      edge.current.visible = painting;
    }
    if (edgeMat.current) edgeMat.current.color.set(healthColor(r.health));
  });

  return (
    <group position={[0, PANEL_Y, 0]}>
      {/* backing */}
      <mesh position={[0, 0, -0.12]} receiveShadow>
        <boxGeometry args={[PANEL_W + 0.2, PANEL_H + 0.2, 0.2]} />
        <meshStandardMaterial color="#10171300" transparent opacity={0} />
      </mesh>
      {/* corroded surface */}
      <mesh receiveShadow>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.16]} />
        <meshStandardMaterial color="#3b3326" roughness={0.95} metalness={0.1} />
      </mesh>
      {/* cleaned metal region (scales from left) */}
      <mesh ref={clean} position={[0, 0, 0.02]}>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.16]} />
        <meshStandardMaterial color="#c7d6e6" metalness={0.8} roughness={0.28} emissive="#2a3a48" emissiveIntensity={0.2} />
      </mesh>
      {/* working edge line */}
      <mesh ref={edge} position={[0, 0, 0.12]}>
        <boxGeometry args={[0.05, PANEL_H, 0.05]} />
        <meshBasicMaterial ref={edgeMat} color="#35e17f" />
      </mesh>
    </group>
  );
}

// Gantry rail + arm that tracks the working edge and sprays.
function Gantry({ robotRef, animationSpeed }: { robotRef: React.MutableRefObject<Robot>; animationSpeed: number }) {
  const carriage = useRef<THREE.Group>(null!);
  const nozzle = useRef<THREE.Group>(null!);
  const spray = useRef<THREE.Mesh>(null!);
  const sprayMat = useRef<THREE.MeshBasicMaterial>(null!);
  const upper = useRef<THREE.Mesh>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    const r = robotRef.current;
    const clearingOb = r.obstacles.find((o) => o.state === 'clearing');
    const frac = r.job.completionPercent / 100;
    const targetX = clearingOb ? -HALF + (clearingOb.atPercent / 100) * PANEL_W : -HALF + frac * PANEL_W;
    const running = r.status === 'running';
    if (running) t.current += d * animationSpeed;

    if (carriage.current) {
      carriage.current.position.x += (targetX - carriage.current.position.x) * Math.min(1, d * 4);
    }
    const painting = running && !clearingOb;
    if (nozzle.current) {
      const sway = running ? Math.sin(t.current * 3) * 0.12 : 0;
      const reach = clearingOb ? 0.35 : 0; // lean in to push obstacle
      nozzle.current.position.x = sway;
      nozzle.current.position.z = 0.55 - reach;
    }
    if (upper.current) upper.current.rotation.z = running ? Math.sin(t.current * 1.6) * 0.1 : 0;
    if (spray.current) spray.current.visible = painting;
    if (sprayMat.current) sprayMat.current.opacity = painting ? 0.15 + (r.sprayIntensity / 100) * 0.25 : 0;
  });

  const railY = PANEL_Y + PANEL_H / 2 + 0.9;
  const metal = <meshStandardMaterial color="#e9eef0" metalness={0.7} roughness={0.32} />;
  const accent = <meshStandardMaterial color="#35e17f" emissive="#35e17f" emissiveIntensity={0.5} metalness={0.5} roughness={0.3} />;

  return (
    <>
      {/* rail */}
      <mesh position={[0, railY, 0.55]} castShadow>
        <boxGeometry args={[PANEL_W + 1.4, 0.16, 0.16]} />
        <meshStandardMaterial color="#26332b" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={carriage} position={[-HALF, railY, 0.55]}>
        {/* carriage block */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.34, 0.34]} />
          {metal}
        </mesh>
        {/* arm reaching down toward the panel */}
        <mesh ref={upper} position={[0, -0.55, 0.1]} castShadow>
          <boxGeometry args={[0.16, 1.0, 0.16]} />
          {metal}
        </mesh>
        <group ref={nozzle} position={[0, -1.05, 0.55]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.16, 0.34, 20]} />
            {accent}
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <coneGeometry args={[0.09, 0.2, 16]} />
            <meshStandardMaterial color="#12181a" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* spray cone toward panel (-z) */}
          <mesh ref={spray} position={[0, -0.3, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.28, 0.7, 20, 1, true]} />
            <meshBasicMaterial ref={sprayMat} color="#86c8ff" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    </>
  );
}

const OBSTACLE_COLOR = { crate: '#8a5a2b', toolbox: '#c0392b', cone: '#ff7a1a' } as const;

function Obstacles({ robotRef }: { robotRef: React.MutableRefObject<Robot> }) {
  const timers = useRef<Record<number, number>>({});
  const groups = useRef<Record<number, THREE.Group | null>>({});

  useFrame((_, d) => {
    const r = robotRef.current;
    r.obstacles.forEach((o) => {
      const g = groups.current[o.id];
      if (!g) return;
      const ox = -HALF + (o.atPercent / 100) * PANEL_W;
      const rest = new THREE.Vector3(ox, PANEL_Y - PANEL_H / 2 + 0.28, 0.55);
      const aside = new THREE.Vector3(ox + 0.9, -1.35, 1.3);
      if (o.state === 'ahead') {
        g.position.copy(rest);
        g.rotation.z = 0;
        g.scale.setScalar(1);
      } else if (o.state === 'clearing') {
        timers.current[o.id] = (timers.current[o.id] || 0) + d;
        const t = timers.current[o.id];
        const shake = Math.sin(t * 22) * 0.12 * Math.max(0, 1 - t);
        const slide = Math.min(1, Math.max(0, (t - 0.5) / 1.3));
        g.position.lerpVectors(rest, aside, slide);
        g.position.x += shake;
        g.rotation.z = slide * 0.5;
      } else {
        g.position.copy(aside);
        g.rotation.z = 0.5;
        g.scale.setScalar(0.85);
        timers.current[o.id] = 0;
      }
    });
  });

  return (
    <>
      {robotRef.current.obstacles.map((o) => (
        <group key={o.id} ref={(el) => (groups.current[o.id] = el)}>
          {o.type === 'cone' ? (
            <mesh castShadow>
              <coneGeometry args={[0.3, 0.6, 20]} />
              <meshStandardMaterial color={OBSTACLE_COLOR.cone} roughness={0.5} />
            </mesh>
          ) : (
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color={OBSTACLE_COLOR[o.type]} roughness={0.7} metalness={0.15} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

function Scene({ robotRef, animationSpeed }: { robotRef: React.MutableRefObject<Robot>; animationSpeed: number }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 3, 2]} intensity={0.4} color="#35e17f" />
      <Panel robotRef={robotRef} />
      <Gantry robotRef={robotRef} animationSpeed={animationSpeed} />
      <Obstacles robotRef={robotRef} />
      <ContactShadows position={[0, -1.45, 0]} opacity={0.45} scale={16} blur={2.5} far={4} />
      <Grid position={[0, -1.45, 0]} args={[30, 20]} cellSize={0.6} cellColor="#173026" sectionSize={3} sectionColor="#2f6b4a" fadeDistance={22} infiniteGrid />
      <Environment preset="warehouse" />
      <OrbitControls enablePan minDistance={5} maxDistance={16} maxPolarAngle={Math.PI / 2.05} target={[0, 0.3, 0]} />
    </>
  );
}

export default function CamScene({ robot, animationSpeed }: { robot: Robot; animationSpeed: number }) {
  const robotRef = useRef(robot);
  robotRef.current = robot;
  return (
    <Canvas shadows camera={{ position: [0, 1.6, 8], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#080d0a']} />
      <fog attach="fog" args={['#080d0a', 12, 26]} />
      <Scene robotRef={robotRef} animationSpeed={animationSpeed} />
    </Canvas>
  );
}
