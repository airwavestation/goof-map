'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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

type GoofFamily = 'high-energy' | 'groove' | 'dreamy' | 'other';

function getNodeFamily(node: GoofNode): GoofFamily {
  const g = node.genre.toLowerCase();

  if (g.includes('drum') || g.includes('dubstep') || g.includes('hard')) {
    return 'high-energy';
  }

  if (g.includes('house') || g.includes('garage')) {
    return 'groove';
  }

  if (g.includes('ambient') || g.includes('lo-fi') || g.includes('indie')) {
    return 'dreamy';
  }

  return 'other';
}

function getFamilyColor(family: GoofFamily): string {
  switch (family) {
    case 'high-energy':
      return '#00FF00'; // main neon
    case 'groove':
      return '#66FF66'; // softer green
    case 'dreamy':
      return '#7732D9'; // station purple
    case 'other':
    default:
      return '#FFFFFF';
  }
}

/** Color mapping using station palette & family */
function getNodeBaseColor(node: GoofNode): string {
  return getFamilyColor(getNodeFamily(node));
}

/** Radius scaling based on a “energy” mix of traits */
function getNodeRadius(
  node: GoofNode,
  mode: 'default' | 'hovered' | 'selected'
): number {
  const v = node.values;
  const rawEnergy =
    (v.tempoSpeed +
      v.tempoComplexity +
      v.sonicSynthetic +
      v.sonicTemperature) /
    4;

  const clamped = Math.min(Math.max(rawEnergy, -2), 2); // -2..2
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

    if (isInteracting) {
      setAnimating(false);
      return;
    }

    const targetVec = new Vector3(
      focusRef.current[0],
      focusRef.current[1],
      focusRef.current[2]
    );

    const idealCameraPos = targetVec.clone().add(new Vector3(2.2, 2.2, 2.2));

    camera.position.lerp(idealCameraPos, 0.12);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec, 0.18);
      controlsRef.current.update();
    }

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
  const [familyFilter, setFamilyFilter] = useState<
    'all' | GoofFamily
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNodes = GOOF_NODES.filter((node) => {
    const family = getNodeFamily(node);

    if (familyFilter !== 'all' && family !== familyFilter) {
      return false;
    }

    if (normalizedQuery) {
      const text =
        `${node.name} ${node.genre}`.toLowerCase();
      if (!text.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  const selectedNode =
    GOOF_NODES.find((n) => n.id === selectedId) || null;

  const selectedVisible =
    !!selectedNode &&
    filteredNodes.some((n) => n.id === selectedNode.id);

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
          {filteredNodes.map((node) => {
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
                    isSelected
                      ? baseColor
                      : isHovered
                      ? '#ffffff'
                      : '#000000'
                  }
                  emissiveIntensity={
                    isSelected ? 0.9 : isHovered ? 0.4 : 0
                  }
                  metalness={0.4}
                  roughness={0.35}
                />
              </mesh>
            );
          })}

          <CameraRig
            focusPosition={
              selectedVisible && selectedNode
                ? selectedNode.position
                : null
            }
          />
        </Canvas>
      </div>

      {/* Side panel: controls + details + legend */}
      <aside
        style={{
          width: '300px',
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
        {/* Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.8,
              color: '#00FF00'
            }}
          >
            Filters
          </div>

          <input
            type="text"
            placeholder="Search by name or genre…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.8rem',
              padding: '0.4rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.16)',
              backgroundColor: '#111111',
              color: '#f5f5f5',
              outline: 'none'
            }}
          />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.35rem'
            }}
          >
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'high-energy' as const, label: 'High Energy' },
              { id: 'groove' as const, label: 'Groove / Dance' },
              { id: 'dreamy' as const, label: 'Dreamy / Chill' }
            ].map((option) => {
              const isActive = familyFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFamilyFilter(option.id)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    border: isActive
                      ? '1px solid rgba(0,255,0,0.9)'
                      : '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: isActive ? '#0b2810' : 'transparent',
                    color: isActive ? '#baffc8' : '#dddddd',
                    cursor: 'pointer'
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              opacity: 0.65
            }}
          >
            Showing {filteredNodes.length} / {GOOF_NODES.length} nodes.
          </div>
        </div>

        {/* Node details */}
        <div
          style={{
            marginTop: '0.4rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '0.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            flexGrow: 1
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
                      boxShadow: `0 0 12px ${getNodeBaseColor(
                        selectedNode
                      )}`
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
                  marginTop: '0.2rem',
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
        </div>

        {/* Legend */}
        <div
          style={{
            marginTop: '0.6rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.72rem',
            opacity: 0.8
          }}
        >
          <div
            style={{
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              marginBottom: '0.4rem',
              color: '#aaaaaa'
            }}
          >
            Legend
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              marginBottom: '0.45rem'
            }}
          >
            <LegendSwatch color="#00FF00" label="High Energy" />
            <LegendSwatch color="#66FF66" label="Groove / Dance" />
            <LegendSwatch color="#7732D9" label="Dreamy / Chill" />
          </div>

          <div
            style={{
              lineHeight: 1.4
            }}
          >
            <strong>Size</strong> = composite energy (tempo, rhythmic
            complexity, temperature, synthetic-ness).
            <br />
            <strong>Position</strong> encodes the 6-axis GOOF signature
            (Tempo, Tonality, Timbre) in 3D space.
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Tiny helper component for legend color dots */
function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}
    >
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '999px',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`
        }}
      />
      <span>{label}</span>
    </div>
  );
}
