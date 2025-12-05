'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Canvas,
  useFrame,
  useThree
} from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
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

/** Color mapping based on loose “families” using station palette */
function getNodeBaseColor(node: GoofNode): string {
  const g = node.genre.toLowerCase();

  if (g.includes('drum') || g.includes('dubstep') || g.includes('hard')) {
    // high-energy / ravey stuff = main neon green
    return '#00FF00';
  }

  if (g.includes('house') || g.includes('garage')) {
    // groovy / dancefloor but smoother
    return '#6CFF66';
  }

  if (g.includes('ambient') || g.includes('lo-fi') || g.includes('indie')) {
    // dreamy / introspective = station purple
    return '#7732D9';
  }

  return '#FFFFFF';
}

/** Radius scaling based on a “energy” mix of traits */
function getNodeRadius(node: GoofNode, mode: 'default' | 'hovered' | 'selected'): number {
  const v = node.values;
  const rawEnergy =
    (v.tempoSpeed +
      v.tempoComplexity +
      v.sonicSynthetic +
      v.sonicTemperature) / 4;

  // rawEnergy ~ -2..2 → map to 0..1
  const clamped = Math.min(Math.max(rawEnergy, -2), 2);
  const norm = (clamped + 2) / 4; // 0..1

  const base = 0.07 + norm * 0.06;

  if (mode === 'selected') return base + 0.06;
  if (mode === 'hovered') return base + 0.03;
  return base;
}

/** Camera rig that zooms to the selected node once, then lets the user drive */
type CameraRigProps = {
  focusPosition: [number, number, number] | null;
};

function CameraRig({ focusPosition }: CameraRigProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const focusRef = useRef<[number, number, number] | null>(null);
  const [animating, setAnimating] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // When the focus changes (click a new node), start a brief animation toward it.
  useEffect(() => {
    if (focusPosition) {
      focusRef.current = focusPosition;
      setAnimating(true);
    } else {
      focusRef.current = null;
      setAnimating(false);
    }
  }, [focusPosition]);

  useFrame(() => {
    if (!focusRef.current) return;
    if (!animating) return;

    // If the user starts rotating/zooming, stop auto animation.
    if (isInteracting) {
      setAnimating(false);
      return;
    }

    const targetVec = new Vector3(
      focusRef.current[0],
      focusRef.current[1],
      focusRef.current[2]
    );

    // Move in closer than before so the node fills more of the view.
    const idealCameraPos = targetVec.clone().add(new Vector3(2.2, 2.2, 2.2));

    camera.position.lerp(idealCameraPos, 0.12);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec, 0.18);
      controlsRef.current.update();
    }

    // Once we're basically at the target, stop animating.
    if (camera.position.distanceTo(idealCameraPos) < 0.02) {
      setAnimating(false);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={0.6}
      maxDistance={12}
      minDistance={0.8}
      onStart={() => setIsInteracting(true)}
      onEnd={() => setIsInteracting(false)}
    />
  );
}

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
        background:
          'radial-gradient(circle at top, #242424 0, #1E1E1E 45%, #050505 100%)'
      }}
    >
      {/* 3D viewport */}
      <div
        style={{
          flex: 1,
          minWidth: 0
        }}
      >
        <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
          {/* lighting */}
          <ambientLight intensity={0.65} />
          <directionalLight position={[6, 6, 6]} intensity={0.9} />
          <directionalLight position={[-4, -3, -5]} intensity={0.3} />

          {/* grid with neon center line */}
          <gridHelper args={[10, 20, '#00FF00', '#2A2A2A']} />

          {/* GOOF centroids */}
          {GOOF_NODES.map((node) => {
            const isHovered = hoveredId === node.id;
            const isSelected = selectedId === node.id;

            const baseColor = getNodeBaseColor(node);
            const mode: 'default' | 'hovered' | 'selected' =
              isSelected ? 'selected' : isHovered ? 'hovered' : 'default';
            const radius = getNodeRadius(node, mode);

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
                <sphereGeometry args={[radius, 24, 24]} />
                <meshStandardMaterial
                  color={baseColor}
                  emissive={
                    isSelected ? baseColor : isHovered ? '#ffffff' : '#000000'
                  }
                  emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.4 : 0}
                  metalness={0.4}
                  roughness={0.35}
                />
              </mesh>
            );
          })}

          <CameraRig focusPosition={selectedNode?.position ?? null} />
        </Canvas>
      </div>

      {/* Info panel */}
      <aside
        style={{
          width: '280px',
          borderLeft: '1px solid rgba(0,255,0,0.25)',
          padding: '1rem 1.1rem',
          fontSize: '0.85rem',
          color: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(5,5,5,0.98) 100%)',
          boxShadow: '0 0 22px rgba(0,0,0,0.6)'
        }}
      >
        <div
          style={{
            opacity: 0.8,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            color: '#00FF00'
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
                  marginBottom: '0.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>{selectedNode.name}</span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    backgroundColor: getNodeBaseColor(selectedNode),
                    boxShadow: `0 0 12px ${getNodeBaseColor(selectedNode)}`
                  }}
                />
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
                borderTop: '1px solid rgba(255,255,255,0.08)',
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
                      border: '1px solid rgba(0,255,0,0.5)',
                      textDecoration: 'none',
                      color: '#c9ffd7',
                      background:
                        'radial-gradient(circle, rgba(0,255,0,0.2) 0, transparent 70%)'
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
                      border: '1px solid rgba(119,50,217,0.6)',
                      textDecoration: 'none',
                      color: '#f0ddff',
                      background:
                        'radial-gradient(circle, rgba(119,50,217,0.26) 0, transparent 70%)'
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
                border: '1px solid rgba(255,255,255,0.25)',
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
              opacity: 0.75,
              lineHeight: 1.4
            }}
          >
            Click a floating node in the map to inspect its{' '}
            <span style={{ fontStyle: 'italic', color: '#00FF00' }}>
              GOOF signature
            </span>{' '}
            and open an example transmission.
          </div>
        )}
      </aside>
    </div>
  );
}
