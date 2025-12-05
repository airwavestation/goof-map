'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export function GoofScene() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
        {/* basic lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />

        {/* temporary placeholder object so we can see *something* */}
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial />
        </mesh>

        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
