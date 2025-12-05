'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

type GoofPoint = {
  id: string;
  name: string;
  position: [number, number, number];
};

// Hardcoded test coordinates for Day 2
const TEST_POINTS: GoofPoint[] = [
  { id: 'origin', name: 'Origin', position: [0, 0, 0] },
  { id: 'alpha', name: 'Alpha', position: [1.2, 0.4, -0.8] },
  { id: 'beta', name: 'Beta', position: [-0.9, 1.1, 0.6] },
  { id: 'gamma', name: 'Gamma', position: [0.3, -1.3, 1.0] },
  { id: 'delta', name: 'Delta', position: [-1.4, -0.7, -0.5] },
  { id: 'epsilon', name: 'Epsilon', position: [0.8, 1.4, -1.2] },
];

export function GoofScene() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
        {/* lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={0.9} />

        {/* Simple background reference: a faint grid plane */}
        <gridHelper args={[10, 10, '#555555', '#333333']} />

        {/* Our hardcoded GOOF points */}
        {TEST_POINTS.map((point) => (
          <mesh key={point.id} position={point.position}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial metalness={0.3} roughness={0.4} />
          </mesh>
        ))}

        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
