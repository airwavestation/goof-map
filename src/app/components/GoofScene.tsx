'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import goofsRaw from '../data/goofs.json';

type GoofValues = {
  tempoSpeed: number;
  tempoComplexity: number;
  harmonicQuality: number;
  harmonicDensity: number;
  sonicTemperature: number;
  sonicSynthetic: number;
};

type GoofLinks = {
  spotify?: string;
  youtube?: string;
  bandcamp?: string;
};

type GoofNode = {
  id: string;
  name: string;
  genre: string;
  position: [number, number, number];
  values: GoofValues;
  links?: GoofLinks;
};

const GOOF_NODES: GoofNode[] = goofsRaw as GoofNode[];

export function GoofScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

        {/* reference grid */}
        <gridHelper args={[10, 10, '#555555', '#333333']} />

        {/* GOOF centroids */}
        {GOOF_NODES.map((node) => {
          const isHovered = hoveredId === node.id;

          return (
            <mesh
              key={node.id}
              position={node.position}
              onPointerOver={(event) => {
                event.stopPropagation();
                setHoveredId(node.id);
              }}
              onPointerOut={(event) => {
                event.stopPropagation();
                setHoveredId((current) =>
                  current === node.id ? null : current
                );
              }}
            >
              <sphereGeometry args={[isHovered ? 0.14 : 0.09, 20, 20]} />
              <meshStandardMaterial
                color={isHovered ? '#ffe9a6' : '#ffffff'}
                emissive={isHovered ? '#ffe9a6' : '#000000'}
                emissiveIntensity={isHovered ? 0.9 : 0}
                metalness={0.3}
                roughness={0.4}
              />
            </mesh>
          );
        })}

        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
