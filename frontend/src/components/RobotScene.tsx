import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { Robot } from '../lib/types';

type Palette = { key: string; ring: string; glow: string; arm: string };
// Arm stays Temple-Allen orange; the pad/ring/label carry the health status.
const HEALTH: Record<string, Palette> = {
  healthy: { key: 'healthy', ring: '#22c55e', glow: '#22c55e', arm: '#ff6a1a' },
  warning: { key: 'warning', ring: '#ffb020', glow: '#ffb020', arm: '#ff6a1a' },
  fault: { key: 'fault', ring: '#ff6b6b', glow: '#ff6b6b', arm: '#ff6a1a' },
};

function Arm({ joints, palette, running, animationSpeed }: { joints: number[]; palette: Palette; running: boolean; animationSpeed: number }) {
  const base = useRef<THREE.Group>(null!);
  const shoulder = useRef<THREE.Group>(null!);
  const elbow = useRef<THREE.Group>(null!);
  const wrist = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    const k = Math.min(1, delta * 4 * animationSpeed);
    const t = joints;
    if (base.current) base.current.rotation.y += (t[0] - base.current.rotation.y) * k;
    if (shoulder.current) shoulder.current.rotation.z += (t[1] - shoulder.current.rotation.z) * k;
    if (elbow.current) elbow.current.rotation.z += (t[2] - elbow.current.rotation.z) * k;
    if (wrist.current) wrist.current.rotation.z += (t[3] - wrist.current.rotation.z) * k;
  });

  const steel = <meshStandardMaterial color="#c9ccd2" metalness={0.75} roughness={0.35} />;
  const dark = <meshStandardMaterial color="#16181c" metalness={0.85} roughness={0.28} />;
  const accent = (
    <meshStandardMaterial color={palette.arm} metalness={0.55} roughness={0.3} emissive={palette.arm} emissiveIntensity={0.35} />
  );

  return (
    <group position={[0, -1.05, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 1.0, 0.24, 48]} />
        {dark}
      </mesh>
      <group ref={base} position={[0, 0.24, 0]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.66, 0.56, 40]} />
          {accent}
        </mesh>
        <group ref={shoulder} position={[0, 0.56, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.34, 32, 32]} />
            {dark}
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[0.32, 1.9, 0.32]} />
            {steel}
          </mesh>
          <mesh position={[0.19, 0.95, 0]} castShadow>
            <boxGeometry args={[0.05, 1.7, 0.34]} />
            {accent}
          </mesh>
          <group ref={elbow} position={[0, 1.9, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.27, 28, 28]} />
              {accent}
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow>
              <boxGeometry args={[0.24, 1.6, 0.24]} />
              {steel}
            </mesh>
            <group ref={wrist} position={[0, 1.6, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.2, 24, 24]} />
                {dark}
              </mesh>
              <mesh position={[0, 0.34, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.24, 0.44, 24]} />
                {accent}
              </mesh>
              <mesh position={[0, 0.62, 0]}>
                <coneGeometry args={[0.12, 0.28, 20]} />
                {dark}
              </mesh>
              {running && <pointLight position={[0, 0.85, 0]} color={palette.glow} intensity={3} distance={2.4} />}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// Glowing pad + orbiting ring under the robot (ref1 signature).
function Pad({ color }: { color: string }) {
  const ring = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => {
    if (ring.current) ring.current.rotation.z += d * 0.4;
  });
  return (
    <group position={[0, -1.15, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.1, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.0, 2.12, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.6, 1.64, 64, 1, 0, Math.PI * 1.2]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Scene({ robot, animationSpeed }: { robot: Robot; animationSpeed: number }) {
  const palette = HEALTH[robot.health] || HEALTH.healthy;
  const running = robot.status === 'running';

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 9, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#ff6a1a" />
      <spotLight position={[0, 8, 0]} angle={0.5} penumbra={1} intensity={0.6} color="#ff8a3d" />

      <Float speed={running ? 1.4 : 0.8} rotationIntensity={0.15} floatIntensity={0.4}>
        <Arm joints={robot.joints} palette={palette} running={running} animationSpeed={animationSpeed} />
        <Pad color={palette.glow} />
        {/* floating status label — ref1 style */}
        <Html position={[1.7, 2.4, 0]} distanceFactor={9} occlude={false}>
          <div className="whitespace-nowrap flex items-center gap-2 rounded-full bg-black/70 backdrop-blur px-3 py-1.5 border border-white/10">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: palette.glow, boxShadow: `0 0 10px ${palette.glow}` }} />
            <span className="text-white font-semibold text-sm h-display">AVA-4X</span>
            <span className="font-mono text-sm" style={{ color: palette.ring }}>
              {robot.job.completionPercent.toFixed(0)}%
            </span>
          </div>
        </Html>
      </Float>

      <ContactShadows position={[0, -2.2, 0]} opacity={0.5} scale={12} blur={2.4} far={4} color="#000000" />
      <Grid
        position={[0, -2.2, 0]}
        args={[30, 30]}
        cellSize={0.7}
        cellColor="#2a1c12"
        sectionSize={3.5}
        sectionColor="#6b3a1a"
        fadeDistance={26}
        fadeStrength={1.5}
        infiniteGrid
      />
      <Environment preset="city" />
      <OrbitControls
        enablePan
        autoRotate={running}
        autoRotateSpeed={0.4}
        minDistance={4}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.6, 0]}
        makeDefault
      />
    </>
  );
}

export default function RobotScene({ robot, animationSpeed }: { robot: Robot; animationSpeed: number }) {
  return (
    <Canvas shadows camera={{ position: [6, 4.2, 6.5], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <Scene robot={robot} animationSpeed={animationSpeed} />
    </Canvas>
  );
}
