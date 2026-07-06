import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { HEALTH_COLOR } from '../lib/status';

interface Props {
  joints: number[];
  health: string;
  running: boolean;
  animationSpeed: number;
}

// A 4-DOF articulated arm. Joint targets come from the backend simulation;
// we lerp toward them each frame for smooth motion.
function Arm({ joints, color, running, animationSpeed }: { joints: number[]; color: string; running: boolean; animationSpeed: number }) {
  const base = useRef<THREE.Group>(null!);
  const shoulder = useRef<THREE.Group>(null!);
  const elbow = useRef<THREE.Group>(null!);
  const wrist = useRef<THREE.Group>(null!);
  const target = useRef([0, 0.2, -0.4, 0]);

  useFrame((_, delta) => {
    target.current = joints;
    const k = Math.min(1, delta * 4 * animationSpeed);
    if (base.current) base.current.rotation.y += (target.current[0] - base.current.rotation.y) * k;
    if (shoulder.current)
      shoulder.current.rotation.z += (target.current[1] - shoulder.current.rotation.z) * k;
    if (elbow.current)
      elbow.current.rotation.z += (target.current[2] - elbow.current.rotation.z) * k;
    if (wrist.current)
      wrist.current.rotation.z += (target.current[3] - wrist.current.rotation.z) * k;
  });

  const metal = <meshStandardMaterial color="#3a4658" metalness={0.8} roughness={0.35} />;
  const accent = (
    <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} emissive={color} emissiveIntensity={0.35} />
  );

  return (
    <group position={[0, -1, 0]}>
      {/* Base plinth */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 1, 0.2, 40]} />
        {metal}
      </mesh>
      <group ref={base} position={[0, 0.2, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.7, 0.5, 32]} />
          {accent}
        </mesh>
        {/* Shoulder joint */}
        <group ref={shoulder} position={[0, 0.5, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.35, 24, 24]} />
            {metal}
          </mesh>
          {/* Upper arm */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.34, 1.8, 0.34]} />
            {metal}
          </mesh>
          {/* Elbow joint */}
          <group ref={elbow} position={[0, 1.8, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.28, 24, 24]} />
              {accent}
            </mesh>
            {/* Forearm */}
            <mesh position={[0, 0.75, 0]} castShadow>
              <boxGeometry args={[0.26, 1.5, 0.26]} />
              {metal}
            </mesh>
            {/* Wrist + tool head */}
            <group ref={wrist} position={[0, 1.5, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.22, 20, 20]} />
                {metal}
              </mesh>
              <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.28, 0.5, 20]} />
                {accent}
              </mesh>
              {/* Spray nozzle */}
              <mesh position={[0, 0.65, 0]}>
                <coneGeometry args={[0.14, 0.3, 16]} />
                <meshStandardMaterial color="#1a2331" metalness={0.9} roughness={0.2} />
              </mesh>
              {running && (
                <pointLight position={[0, 0.85, 0]} color={color} intensity={2} distance={2.5} />
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function RobotArm3D({ joints, health, running, animationSpeed }: Props) {
  const color = HEALTH_COLOR[health] || '#22c55e';
  return (
    <Canvas shadows camera={{ position: [4.5, 3, 5], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={['#0a0e14']} />
      <fog attach="fog" args={['#0a0e14', 10, 22]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 6]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -4]} intensity={0.4} color="#ff6b1a" />
      <Arm joints={joints} color={color} running={running} animationSpeed={animationSpeed} />
      <Grid
        position={[0, -1.1, 0]}
        args={[24, 24]}
        cellSize={0.6}
        cellColor="#26303f"
        sectionSize={3}
        sectionColor="#ff6b1a"
        fadeDistance={22}
        infiniteGrid
      />
      <Environment preset="warehouse" />
      <OrbitControls
        enablePan
        minDistance={3}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  );
}
