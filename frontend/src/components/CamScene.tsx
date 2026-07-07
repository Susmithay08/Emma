import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { Robot } from '../lib/types';

const PANEL_W = 8;
const PANEL_H = 2.4;
const PANEL_Y = 0.5;
const HALF = PANEL_W / 2;
const FLOOR_Y = -1.45;
const STANDOFF = 2.1; // arm base distance in front of the panel
const SHOULDER_H = 0.8;
const L1 = 1.4; // upper arm
const LF = 1.0; // forearm
const TOOL = 0.28;
const L2 = LF + TOOL; // forearm + tool head (IK reaches the tool tip)
const PIVOT_Y = FLOOR_Y + SHOULDER_H;

type CarryRef = React.MutableRefObject<{ id: number; active: boolean; pos: THREE.Vector3 }>;

function healthColor(h: string) {
  return h === 'fault' ? '#ff6b6b' : h === 'warning' ? '#ffb020' : '#35e17f';
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// 2-link planar inverse kinematics: reach the tool tip to (R forward, dy up).
function solveIK(R: number, dy: number) {
  const D2 = R * R + dy * dy;
  const cos2 = clamp((D2 - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1);
  const phi2 = Math.acos(cos2);
  const phi1 = Math.atan2(R, dy) - Math.atan2(L2 * Math.sin(phi2), L1 + L2 * Math.cos(phi2));
  return { pitch1: -phi1, pitch2: -phi2 };
}

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
      <mesh receiveShadow>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.16]} />
        <meshStandardMaterial color="#3b3326" roughness={0.95} metalness={0.1} />
      </mesh>
      <mesh ref={clean} position={[0, 0, 0.02]}>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.16]} />
        <meshStandardMaterial color="#c7d6e6" metalness={0.8} roughness={0.28} emissive="#2a3a48" emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={edge} position={[0, 0, 0.12]}>
        <boxGeometry args={[0.05, PANEL_H, 0.05]} />
        <meshBasicMaterial ref={edgeMat} color="#35e17f" />
      </mesh>
    </group>
  );
}

const V = new THREE.Vector3();
const DESIRED = new THREE.Vector3();

function ArmRig({ robotRef, animationSpeed, carry }: { robotRef: React.MutableRefObject<Robot>; animationSpeed: number; carry: CarryRef }) {
  const root = useRef<THREE.Group>(null!);
  const shoulder = useRef<THREE.Group>(null!);
  const elbow = useRef<THREE.Group>(null!);
  const wrist = useRef<THREE.Group>(null!);
  const tip = useRef<THREE.Object3D>(null!);
  const target = useRef(new THREE.Vector3(-HALF, PANEL_Y, 0.16));
  const baseX = useRef(-HALF);
  const clock = useRef(0);
  const clearId = useRef(-1);
  const clearT = useRef(0);

  useFrame((_, d) => {
    const r = robotRef.current;
    clock.current += d;
    const running = r.status === 'running';
    const clearingOb = r.obstacles.find((o) => o.state === 'clearing');
    const frac = r.job.completionPercent / 100;
    const edgeX = -HALF + frac * PANEL_W;

    // base slides along the track toward the work point
    const wantBaseX = clearingOb ? -HALF + (clearingOb.atPercent / 100) * PANEL_W : edgeX;
    baseX.current += (wantBaseX - baseX.current) * Math.min(1, d * 3);

    let grabbed = false;
    if (clearingOb) {
      if (clearId.current !== clearingOb.id) {
        clearId.current = clearingOb.id;
        clearT.current = 0;
      }
      clearT.current += d * animationSpeed;
      const tt = clearT.current;
      const ox = -HALF + (clearingOb.atPercent / 100) * PANEL_W;
      const restY = PANEL_Y - PANEL_H / 2 + 0.28;
      const dropY = FLOOR_Y + 0.3;
      // pick-and-place keyframes: approach → grab → lift → carry → place → retract
      if (tt < 0.8) DESIRED.set(ox, 0.25, 0.75); // approach above
      else if (tt < 1.5) { DESIRED.set(ox, restY, 0.55); grabbed = tt > 1.15; } // grab
      else if (tt < 2.3) { DESIRED.set(ox, 0.4, 0.9); grabbed = true; } // lift
      else if (tt < 3.1) { DESIRED.set(ox, dropY + 0.15, 1.05); grabbed = true; } // carry down to floor
      else DESIRED.set(ox, 0.25, 0.75); // release + retract
    } else {
      clearId.current = -1;
      clearT.current = 0;
      const wob = running ? Math.sin(clock.current * 3) * 0.12 : 0;
      DESIRED.set(edgeX, PANEL_Y + wob, 0.16); // paint at working edge
    }

    // ease the actual target for smooth motion
    target.current.lerp(DESIRED, Math.min(1, d * 3.5));

    // solve IK toward eased target (relative to the base)
    const dx = target.current.x - baseX.current;
    const dzW = target.current.z - STANDOFF;
    const yaw = Math.atan2(-dx, -dzW);
    const Rh = Math.hypot(dx, dzW);
    const dy = target.current.y - PIVOT_Y;
    const { pitch1, pitch2 } = solveIK(Rh, dy);

    if (root.current) {
      root.current.position.x = baseX.current;
      root.current.rotation.y = yaw;
    }
    if (shoulder.current) shoulder.current.rotation.x = pitch1;
    if (elbow.current) elbow.current.rotation.x = pitch2;
    if (wrist.current) wrist.current.rotation.x = running && !clearingOb ? Math.sin(clock.current * 4) * 0.05 : 0;

    // carried obstacle follows the tool tip
    if (tip.current) {
      tip.current.getWorldPosition(V);
      if (clearingOb && grabbed) {
        carry.current.active = true;
        carry.current.id = clearingOb.id;
        carry.current.pos.copy(V);
        carry.current.pos.y -= 0.25;
      } else {
        carry.current.active = false;
        carry.current.id = -1;
      }
    }
  });

  const steel = <meshStandardMaterial color="#e9eef0" metalness={0.7} roughness={0.32} />;
  const dark = <meshStandardMaterial color="#1b2620" metalness={0.85} roughness={0.28} />;
  const accent = <meshStandardMaterial color="#3fae7a" emissive="#35e17f" emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />;

  return (
    <group ref={root} position={[-HALF, FLOOR_Y, STANDOFF]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.62, 0.24, 40]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.5, 0.5, 32]} />
        {accent}
      </mesh>
      <group ref={shoulder} position={[0, SHOULDER_H, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 28, 28]} />
          {dark}
        </mesh>
        <mesh position={[0, L1 / 2, 0]} castShadow>
          <boxGeometry args={[0.28, L1, 0.28]} />
          {steel}
        </mesh>
        <mesh position={[0.16, L1 / 2, 0]} castShadow>
          <boxGeometry args={[0.05, L1 * 0.85, 0.3]} />
          {accent}
        </mesh>
        <group ref={elbow} position={[0, L1, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.26, 24, 24]} />
            {accent}
          </mesh>
          <mesh position={[0, LF / 2, 0]} castShadow>
            <boxGeometry args={[0.22, LF, 0.22]} />
            {steel}
          </mesh>
          <group ref={wrist} position={[0, LF, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.2, 20, 20]} />
              {dark}
            </mesh>
            <mesh position={[0, TOOL / 2, 0]} castShadow>
              <cylinderGeometry args={[0.13, 0.19, TOOL, 20]} />
              {accent}
            </mesh>
            <object3D ref={tip} position={[0, TOOL, 0]} />
          </group>
        </group>
      </group>
    </group>
  );
}

// Spray + contact glow, anchored to the panel surface at the working edge so it
// always lands ON the wall (never pokes through), regardless of arm pose.
function Spray({ robotRef }: { robotRef: React.MutableRefObject<Robot> }) {
  const grp = useRef<THREE.Group>(null!);
  const coneMat = useRef<THREE.MeshBasicMaterial>(null!);
  const spotMat = useRef<THREE.MeshBasicMaterial>(null!);
  const clock = useRef(0);
  useFrame((_, d) => {
    const r = robotRef.current;
    clock.current += d;
    const painting = r.status === 'running' && !r.obstacles.some((o) => o.state === 'clearing');
    const frac = r.job.completionPercent / 100;
    const edgeX = -HALF + frac * PANEL_W;
    const wob = painting ? Math.sin(clock.current * 3) * 0.12 : 0;
    if (grp.current) {
      grp.current.position.x = edgeX;
      grp.current.position.y = PANEL_Y + wob;
      grp.current.visible = painting;
    }
    const inten = 0.14 + (r.sprayIntensity / 100) * 0.32;
    if (coneMat.current) coneMat.current.opacity = inten;
    if (spotMat.current) spotMat.current.opacity = inten + 0.1;
  });
  return (
    <group ref={grp} position={[-HALF, PANEL_Y, 0.11]}>
      {/* cone: wide base on the wall, narrow toward the nozzle (camera side) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
        <coneGeometry args={[0.18, 0.38, 20, 1, true]} />
        <meshBasicMaterial ref={coneMat} color="#86c8ff" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* glowing contact patch on the surface */}
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[0.16, 24]} />
        <meshBasicMaterial ref={spotMat} color="#bfe3ff" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Track() {
  return (
    <mesh position={[0, FLOOR_Y + 0.01, STANDOFF]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PANEL_W + 1.5, 0.6]} />
      <meshStandardMaterial color="#12241b" metalness={0.4} roughness={0.6} />
    </mesh>
  );
}

const OBSTACLE_COLOR = { crate: '#8a5a2b', toolbox: '#c0392b', cone: '#ff7a1a' } as const;

function Obstacles({ robotRef, carry }: { robotRef: React.MutableRefObject<Robot>; carry: CarryRef }) {
  const groups = useRef<Record<number, THREE.Group | null>>({});
  useFrame(() => {
    const r = robotRef.current;
    r.obstacles.forEach((o) => {
      const g = groups.current[o.id];
      if (!g) return;
      const ox = -HALF + (o.atPercent / 100) * PANEL_W;
      if (carry.current.active && carry.current.id === o.id) {
        g.position.copy(carry.current.pos); // riding the tool
        g.rotation.z = 0;
      } else if (o.state === 'cleared') {
        g.position.set(ox, FLOOR_Y + 0.28, 1.05); // placed neatly on the floor
        g.rotation.z = 0;
        g.scale.setScalar(0.9);
      } else {
        g.position.set(ox, PANEL_Y - PANEL_H / 2 + 0.28, 0.55); // sitting on the panel
        g.rotation.z = 0;
        g.scale.setScalar(1);
      }
    });
  });
  return (
    <>
      {robotRef.current.obstacles.map((o) => (
        <group key={o.id} ref={(el) => (groups.current[o.id] = el)}>
          {o.type === 'cone' ? (
            <mesh castShadow>
              <coneGeometry args={[0.28, 0.56, 20]} />
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
  const carry = useRef({ id: -1, active: false, pos: new THREE.Vector3() });
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 3, 2]} intensity={0.4} color="#35e17f" />
      <Panel robotRef={robotRef} />
      <Track />
      <ArmRig robotRef={robotRef} animationSpeed={animationSpeed} carry={carry} />
      <Spray robotRef={robotRef} />
      <Obstacles robotRef={robotRef} carry={carry} />
      <ContactShadows position={[0, FLOOR_Y, 0]} opacity={0.45} scale={16} blur={2.5} far={4} />
      <Grid position={[0, FLOOR_Y, 0]} args={[30, 20]} cellSize={0.6} cellColor="#173026" sectionSize={3} sectionColor="#2f6b4a" fadeDistance={22} infiniteGrid />
      <Environment preset="warehouse" />
      <OrbitControls enablePan minDistance={5} maxDistance={16} maxPolarAngle={Math.PI / 2.05} target={[0, 0.3, 0]} />
    </>
  );
}

export default function CamScene({ robot, animationSpeed }: { robot: Robot; animationSpeed: number }) {
  const robotRef = useRef(robot);
  robotRef.current = robot;
  return (
    <Canvas shadows camera={{ position: [1.5, 1.8, 8], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#080d0a']} />
      <fog attach="fog" args={['#080d0a', 13, 28]} />
      <Scene robotRef={robotRef} animationSpeed={animationSpeed} />
    </Canvas>
  );
}
