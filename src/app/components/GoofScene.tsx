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
  description: string;
  position: [number, number, number];
  values: GoofValues;
  links?: GoofLinks;
};

const GOOF_NODES: GoofNode[] = goofsRaw as GoofNode[];

export function GoofScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = GOOF_NODES.find((n) => n.id === selectedId) || null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'radial-gradient(circle at top, #141824 0, #020308 55%)'
      }}
    >
      {/* 3D viewport */}
      <div
        style={{
          flex: 1,
          minWidth: 0 // prevents flex child from overflowing
        }}
      >
        <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
          {/* lighting */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={0.9} />

          {/* reference grid */}
          <gridHelper args={[10, 10, '#444444', '#222222']} />

          {/* GOOF centroids */}
          {GOOF_NODES.map((node) => {
            const isHovered = hoveredId === node.id;
            const isSelected = selectedId === node.id;

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
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(node.id);
                }}
              >
                <sphereGeometry
                  args={[isSelected ? 0.16 : isHovered ? 0.13 : 0.09, 22, 22]}
                />
                <meshStandardMaterial
                  color={
                    isSelected
                      ? '#ffe9a6'
                      : isHovered
                      ? '#b5d7ff'
                      : '#ffffff'
                  }
                  emissive={isSelected ? '#ffe9a6' : isHovered ? '#4f6cff' : '#000000'}
                  emissiveIntensity={isSelected ? 1.0 : isHovered ? 0.5 : 0}
                  metalness={0.35}
                  roughness={0.4}
                />
              </mesh>
            );
          })}

          <OrbitControls enableDamping />
        </Canvas>
      </div>

      {/* Info panel */}
      <aside
        style={{
          width: '280px',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          padding: '1rem 1.1rem',
          fontSize: '0.85rem',
          color: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background:
            'linear-gradient(180deg, rgba(10,12,20,0.95) 0%, rgba(3,4,9,0.98) 100%)'
        }}
      >
        <div
          style={{
            opacity: 0.7,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: '0.7rem'
          }}
        >
          Node Details
        </div>

        {selectedNode ? (
          <>
            <div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  marginBottom: '0.15rem'
                }}
              >
                {selectedNode.name}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  opacity: 0.75
                }}
              >
                {selectedNode.genre}
              </div>
            </div>

            <p
              style={{
                lineHeight: 1.4,
                opacity: 0.9
              }}
            >
              {selectedNode.description}
            </p>

            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '0.6rem',
                marginTop: '0.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  opacity: 0.8
                }}
              >
                Example track:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.4rem'
                }}
              >
                {selectedNode.links?.spotify && (
                  <a
                    href={selectedNode.links.spotify}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.55rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(30,215,96,0.5)',
                      textDecoration: 'none',
                      color: '#c9ffd7'
                    }}
                  >
                    Open on Spotify
                  </a>
                )}
                {selectedNode.links?.youtube && (
                  <a
                    href={selectedNode.links.youtube}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.55rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,0,0,0.5)',
                      textDecoration: 'none',
                      color: '#ffd0d0'
                    }}
                  >
                    Open on YouTube
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              style={{
                marginTop: 'auto',
                alignSelf: 'flex-start',
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#dddddd',
                cursor: 'pointer'
              }}
            >
              Clear selection
            </button>
          </>
        ) : (
          <div
            style={{
              opacity: 0.7,
              lineHeight: 1.4
            }}
          >
            Click a floating node in the map to inspect its{' '}
            <span style={{ fontStyle: 'italic' }}>GOOF signature</span> and open
            an example track.
          </div>
        )}
      </aside>
    </div>
  );
}
