'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { Vector3, Quaternion } from 'three';
import goofsRaw from '../data/goofs.json';
import genreRegionsRaw from '../data/genreRegions.json';

// ---------- GOOF NODE TYPES ----------

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

type Vec3 = [number, number, number];

// visual “inflation” factor for positions
const POSITION_SCALE = 2.0;

function computeSongPosition(values: GoofValues): Vec3 {
  // v1 = positive end, v2 = negative end for each axis
  const vertices: [Vec3, Vec3][] = [
    // tempo_speed:      (-2 slow … +2 fast)
    [[2, 2, 0], [-2, -2, 0]],
    // tempo_complexity: (-2 simple … +2 complex)
    [[2, -2, 0], [-2, 2, 0]],
    // tonality_harmonic: (-2 dissonant … +2 consonant)
    [[2, 0, 2], [-2, 0, -2]],
    // tonality_density: (-2 simple … +2 dense)
    [[-2, 0, 2], [2, 0, -2]],
    // timbre_warmth:    (-2 cold … +2 warm)
    [[0, 2, 2], [0, -2, -2]],
    // timbre_synthetic: (-2 organic … +2 synthetic)
    [[0, -2, 2], [0, 2, -2]],
  ];

  const valueList = [
    values.tempoSpeed,
    values.tempoComplexity,
    values.harmonicQuality,
    values.harmonicDensity,
    values.sonicTemperature,
    values.sonicSynthetic,
  ];

  let position: Vec3 = [0, 0, 0];

  for (let i = 0; i < vertices.length; i++) {
    const [v1, v2] = vertices[i];
    const raw = valueList[i];

    // clamp into [-2, 2]
    const v = Math.max(-2, Math.min(2, raw));

    const w2 = (2 - v) / 4.0; // weight for negative endpoint
    const w1 = (2 + v) / 4.0; // weight for positive endpoint

    const contrib: Vec3 = [
      v2[0] * w2 + v1[0] * w1,
      v2[1] * w2 + v1[1] * w1,
      v2[2] * w2 + v1[2] * w1,
    ];

    position = [
      position[0] + contrib[0],
      position[1] + contrib[1],
      position[2] + contrib[2],
    ];
  }

  // average over 6 axes, then inflate for visual spread
  const avg: Vec3 = [
    position[0] / 6.0,
    position[1] / 6.0,
    position[2] / 6.0,
  ];

  return [
    avg[0] * POSITION_SCALE,
    avg[1] * POSITION_SCALE,
    avg[2] * POSITION_SCALE,
  ];
}

// ---------- GENRE REGIONS (CLOUDS) ----------

type Range = { min: number; max: number };

type GenreRegionBounds = {
  sonicSynthetic: Range;
  sonicTemperature: Range;
  tempoSpeed: Range;
  tempoComplexity: Range;
  harmonicQuality: Range;
  harmonicDensity: Range;
};

type GenreRegion = {
  id: string;
  name: string;
  bounds: GenreRegionBounds;
};

const GENRE_REGIONS = genreRegionsRaw as GenreRegion[];

const GENRE_REGION_COLORS: Record<string, string> = {
  genre_ambient: '#7732D9', // dreamy purple
  genre_synthwave: '#FF6AD5', // neon pink
  genre_house: '#66FF66', // groove green
};

function getRegionColor(region: GenreRegion): string {
  return GENRE_REGION_COLORS[region.id] ?? '#8888ff';
}

const POINTS_PER_REGION = 160;

function randInRange(range: Range): number {
  return range.min + Math.random() * (range.max - range.min);
}

function generateRegionPointClouds(): Record<string, Vec3[]> {
  const clouds: Record<string, Vec3[]> = {};

  for (const region of GENRE_REGIONS) {
    const points: Vec3[] = [];
    const b = region.bounds;

    for (let i = 0; i < POINTS_PER_REGION; i++) {
      const values: GoofValues = {
        tempoSpeed: randInRange(b.tempoSpeed),
        tempoComplexity: randInRange(b.tempoComplexity),
        harmonicQuality: randInRange(b.harmonicQuality),
        harmonicDensity: randInRange(b.harmonicDensity),
        sonicTemperature: randInRange(b.sonicTemperature),
        sonicSynthetic: randInRange(b.sonicSynthetic),
      };

      points.push(computeSongPosition(values));
    }

    clouds[region.id] = points;
  }

  return clouds;
}

// static clouds: same layout each load, not re-randomized every frame
const REGION_POINT_CLOUDS = generateRegionPointClouds();

type GoofInput = Omit<GoofNode, 'position'> & {
  position?: [number, number, number];
};

const GOOF_NODES: GoofNode[] = (goofsRaw as GoofInput[]).map((raw) => ({
  ...raw,
  // ignore any position in JSON and compute from 6D GOOF values instead
  position: computeSongPosition(raw.values),
}));

type GoofFamily = 'high-energy' | 'groove' | 'dreamy' | 'other';

function getNodeRegionColor(node: GoofNode): string | null {
  const name = node.name.toLowerCase();
  const genre = node.genre.toLowerCase();

  for (const region of GENRE_REGIONS) {
    const regionName = region.name.toLowerCase();

    // If the node's name or genre includes the region name,
    // treat it as the centroid for that region.
    if (name.includes(regionName) || genre.includes(regionName)) {
      const color = GENRE_REGION_COLORS[region.id];
      if (color) return color;
    }
  }

  return null;
}


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
      return '#00FF00'; // main neon green
    case 'groove':
      return '#66FF66'; // softer green
    case 'dreamy':
      return '#7732D9'; // station purple
    case 'other':
    default:
      return '#FFFFFF';
  }
}

function getNodeBaseColor(node: GoofNode): string {
  // First: if this node clearly belongs to a named region (e.g. "Ambient",
  // "Synthwave", "House"), use that region's cloud color.
  const regionColor = getNodeRegionColor(node);
  if (regionColor) return regionColor;

  // Fallback: use the broader family color (high-energy / groove / dreamy / other)
  return getFamilyColor(getNodeFamily(node));
}

/** Radius scaling based on an “energy” mix of traits */
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

// ---------- BOUNDARY / CUBOCTAHEDRON DATA ----------

type BoundaryVertex = {
  id: string;
  label: string;
  position: [number, number, number];
};

const BOUNDARY_VERTICES: BoundaryVertex[] = [
  { id: 'v1', label: 'V1', position: [2, 2, 0] },
  { id: 'v2', label: 'V2', position: [-2, -2, 0] },
  { id: 'v3', label: 'V3', position: [2, -2, 0] },
  { id: 'v4', label: 'V4', position: [-2, 2, 0] },
  { id: 'v5', label: 'V5', position: [2, 0, 2] },
  { id: 'v6', label: 'V6', position: [-2, 0, -2] },
  { id: 'v7', label: 'V7', position: [-2, 0, 2] },
  { id: 'v8', label: 'V8', position: [2, 0, -2] },
  { id: 'v9', label: 'V9', position: [0, 2, 2] },
  { id: 'v10', label: 'V10', position: [0, -2, -2] },
  { id: 'v11', label: 'V11', position: [0, 2, -2] },
  { id: 'v12', label: 'V12', position: [0, -2, 2] },
];

const BOUNDARY_VERTEX_MAP: Record<string, BoundaryVertex> =
  BOUNDARY_VERTICES.reduce(
    (acc, v) => {
      acc[v.id] = v;
      return acc;
    },
    {} as Record<string, BoundaryVertex>
  );

function getBoundaryPosition(id: string): [number, number, number] {
  return BOUNDARY_VERTEX_MAP[id].position;
}

// Six axis lines as given
const AXIS_LINES: [string, string][] = [
  ['v1', 'v2'],
  ['v3', 'v4'],
  ['v5', 'v6'],
  ['v7', 'v8'],
  ['v9', 'v10'],
  ['v11', 'v12'],
];

// Cuboctahedron edges (pairs of vertices at edge distance)
const HULL_EDGES: [string, string][] = [
  ['v1', 'v5'],
  ['v1', 'v8'],
  ['v1', 'v9'],
  ['v1', 'v11'],
  ['v2', 'v6'],
  ['v2', 'v7'],
  ['v2', 'v10'],
  ['v2', 'v12'],
  ['v3', 'v5'],
  ['v3', 'v8'],
  ['v3', 'v10'],
  ['v3', 'v12'],
  ['v4', 'v6'],
  ['v4', 'v7'],
  ['v4', 'v9'],
  ['v4', 'v11'],
  ['v5', 'v9'],
  ['v5', 'v12'],
  ['v6', 'v10'],
  ['v6', 'v11'],
  ['v7', 'v9'],
  ['v7', 'v12'],
  ['v8', 'v10'],
  ['v8', 'v11'],
];

// ---------- VERTEX META: AXIS / PARAM INFO ----------

type AxisGroup = 'TEMPO' | 'TONALITY' | 'TIMBRE';

type VertexInfo = {
  id: string;
  title: string;
  group: AxisGroup;
  dimension: string;
  role: 'positive' | 'negative';
  axisLabel: string;
  rangeHint: string;
  oppositeId: string;
  description: string;
  exampleGenres: string;
};

const VERTEX_INFO: Record<string, VertexInfo> = {
  // TEMPO — Rhythm Speed
  v1: {
    id: 'v1',
    title: 'Fast Tempo',
    group: 'TEMPO',
    dimension: 'Rhythm Speed',
    role: 'positive',
    axisLabel: '+2 FAST',
    rangeHint: '-2 SLOW … +2 FAST',
    oppositeId: 'v2',
    description: 'Represents the fastest music in the database.',
    exampleGenres: 'Drum & Bass, Hardcore, Speedcore, Gabber',
  },
  v2: {
    id: 'v2',
    title: 'Slow Tempo',
    group: 'TEMPO',
    dimension: 'Rhythm Speed',
    role: 'negative',
    axisLabel: '-2 SLOW',
    rangeHint: '-2 SLOW … +2 FAST',
    oppositeId: 'v1',
    description: 'Represents the slowest music in the database.',
    exampleGenres: 'Chill, Downtempo, Ambient, Doom Jazz',
  },

  // TEMPO — Rhythm Complexity
  v3: {
    id: 'v3',
    title: 'Complex Rhythm',
    group: 'TEMPO',
    dimension: 'Rhythm Complexity',
    role: 'positive',
    axisLabel: '+2 COMPLEX',
    rangeHint: '-2 SIMPLE … +2 COMPLEX',
    oppositeId: 'v4',
    description:
      'Represents the most rhythmically complex music in the database.',
    exampleGenres: 'Breakcore, Jazz Fusion, IDM',
  },
  v4: {
    id: 'v4',
    title: 'Simple Rhythm',
    group: 'TEMPO',
    dimension: 'Rhythm Complexity',
    role: 'negative',
    axisLabel: '-2 SIMPLE',
    rangeHint: '-2 SIMPLE … +2 COMPLEX',
    oppositeId: 'v3',
    description:
      'Represents the most rhythmically simple music in the database.',
    exampleGenres: 'House, Techno, Trap',
  },

  // TONALITY — Harmonic Quality
  v5: {
    id: 'v5',
    title: 'Consonant Harmony',
    group: 'TONALITY',
    dimension: 'Harmonic Quality',
    role: 'positive',
    axisLabel: '+2 CONSONANT',
    rangeHint: '-2 DISSONANT … +2 CONSONANT',
    oppositeId: 'v6',
    description:
      'Represents the most harmonic, consonant, melodic music in the database.',
    exampleGenres: 'Synthwave, Trance, Deep House, Future Bass',
  },
  v6: {
    id: 'v6',
    title: 'Dissonant Harmony',
    group: 'TONALITY',
    dimension: 'Harmonic Quality',
    role: 'negative',
    axisLabel: '-2 DISSONANT',
    rangeHint: '-2 DISSONANT … +2 CONSONANT',
    oppositeId: 'v5',
    description:
      'Represents the most dissonant, atonal music in the database.',
    exampleGenres: 'Noise, Industrial, Dark Ambient',
  },

  // TONALITY — Harmonic Density
  v7: {
    id: 'v7',
    title: 'Dense Harmony',
    group: 'TONALITY',
    dimension: 'Harmonic Density',
    role: 'positive',
    axisLabel: '+2 DENSE',
    rangeHint: '-2 SIMPLE … +2 DENSE',
    oppositeId: 'v8',
    description:
      'Represents the most harmonically dense music in the database.',
    exampleGenres: 'Jazz Fusion, Progressive House, Orchestral Breakcore',
  },
  v8: {
    id: 'v8',
    title: 'Simple Harmony',
    group: 'TONALITY',
    dimension: 'Harmonic Density',
    role: 'negative',
    axisLabel: '-2 SIMPLE',
    rangeHint: '-2 SIMPLE … +2 DENSE',
    oppositeId: 'v7',
    description:
      'Represents the most harmonically simple, minimal music in the database.',
    exampleGenres: 'Minimal Techno, Drone, Dub Techno',
  },

  // TIMBRE — Sonic Temperature
  v9: {
    id: 'v9',
    title: 'Warm Timbre',
    group: 'TIMBRE',
    dimension: 'Sonic Temperature',
    role: 'positive',
    axisLabel: '+2 WARM',
    rangeHint: '-2 COLD … +2 WARM',
    oppositeId: 'v10',
    description:
      'Represents the warmest, lo-fi-leaning music in the database.',
    exampleGenres: 'Lo-Fi Hip-Hop, Vaporwave, Dream Pop',
  },
  v10: {
    id: 'v10',
    title: 'Cold Timbre',
    group: 'TIMBRE',
    dimension: 'Sonic Temperature',
    role: 'negative',
    axisLabel: '-2 COLD',
    rangeHint: '-2 COLD … +2 WARM',
    oppositeId: 'v9',
    description:
      'Represents the coldest, crispest production in the database.',
    exampleGenres: 'Techno, Glitch, Neurofunk, Industrial',
  },

  // TIMBRE — Synthetic vs Organic
  v11: {
    id: 'v11',
    title: 'Organic Timbre',
    group: 'TIMBRE',
    dimension: 'Sonic Synthetic Value',
    role: 'negative',
    axisLabel: '-2 ORGANIC',
    rangeHint: '-2 ORGANIC … +2 SYNTHETIC',
    oppositeId: 'v12',
    description:
      'Represents the most organic / acoustic-leaning music in the database.',
    exampleGenres: 'Folk, Jazz, Lo-Fi, Deep House',
  },
  v12: {
    id: 'v12',
    title: 'Synthetic Timbre',
    group: 'TIMBRE',
    dimension: 'Sonic Synthetic Value',
    role: 'positive',
    axisLabel: '+2 SYNTHETIC',
    rangeHint: '-2 ORGANIC … +2 SYNTHETIC',
    oppositeId: 'v11',
    description:
      'Represents the most synthetic / digital music in the database.',
    exampleGenres: 'Trance, Techno, Industrial, Hyperpop',
  },
};

// Axis-group colors for vertices
const AXIS_GROUP_COLORS: Record<AxisGroup, string> = {
  TEMPO: '#FFB347', // warm amber
  TONALITY: '#7732D9', // station purple
  TIMBRE: '#009DFF', // cyan / blue
};

function getVertexBaseColor(vertexId: string): string {
  const info = VERTEX_INFO[vertexId];
  if (!info) return '#009DFF';
  return AXIS_GROUP_COLORS[info.group];
}

// ---------- CAMERA RIG ----------

type CameraRigProps = {
  focusPosition: [number, number, number] | null;
};

/** Camera rig that zooms to the selected node/vertex once, then lets the user drive */
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

// ---------- AXIS CYLINDER (HIGHLIGHT) ----------

type AxisCylinderProps = {
  startId: string;
  endId: string;
  group: AxisGroup;
};

function AxisCylinder({ startId, endId, group }: AxisCylinderProps) {
  const startPos = getBoundaryPosition(startId);
  const endPos = getBoundaryPosition(endId);

  const start = new Vector3(startPos[0], startPos[1], startPos[2]);
  const end = new Vector3(endPos[0], endPos[1], endPos[2]);

  const direction = new Vector3().subVectors(end, start);
  const length = direction.length();
  const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);

  // Align cylinder's Y-axis (0,1,0) with axis direction
  const axis = direction.clone().normalize();
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    axis
  );

  const color = AXIS_GROUP_COLORS[group];

  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.05, 0.05, length, 24, 1, true]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.7}
        transparent
        opacity={0.35}
        roughness={0.25}
        metalness={0.3}
      />
    </mesh>
  );
}

// ---------- SPACETIME GRID (CUBIC CAGE) ----------

function SpacetimeGrid({ visible }: { visible: boolean }) {
  if (!visible) return null;

  const size = 10;        // overall cube size
  const half = size / 2;  // +/- extent from center
  const divisions = 20;

  return (
    <group>
      {/* Top + bottom (XZ planes) */}
      <gridHelper
        args={[size, divisions, '#00FF00', '#222222']}
        position={[0, half, 0]}
      />
      <gridHelper
        args={[size, divisions, '#00FF00', '#222222']}
        position={[0, -half, 0]}
      />

      {/* Front + back (XY planes) */}
      <gridHelper
        args={[size, divisions, '#00FF00', '#222222']}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, half]}
      />
      <gridHelper
        args={[size, divisions, '#00FF00', '#222222']}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -half]}
      />

      {/* Left + right (YZ planes) */}
      <gridHelper
        args={[size, divisions, '#00FF00', '#222222']}
        rotation={[0, 0, Math.PI / 2]}
        position={[half, 0, 0]}
      />
      <gridHelper
        args={[size, divisions, '#00FF00', '#222222']}
        rotation={[0, 0, Math.PI / 2]}
        position={[-half, 0, 0]}
      />
    </group>
  );
}

// ---------- MAIN SCENE COMPONENT ----------

export function GoofScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredVertexId, setHoveredVertexId] = useState<string | null>(null);
  const [selectedVertexId, setSelectedVertexId] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<'all' | GoofFamily>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNodes = GOOF_NODES.filter((node) => {
    const family = getNodeFamily(node);

    if (familyFilter !== 'all' && family !== familyFilter) {
      return false;
    }

    if (normalizedQuery) {
      const text = `${node.name} ${node.genre}`.toLowerCase();
      if (!text.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  const selectedNode = GOOF_NODES.find((n) => n.id === selectedId) || null;
  const selectedVertex =
    selectedVertexId != null ? VERTEX_INFO[selectedVertexId] : null;

  const selectedVisible =
    !!selectedNode && filteredNodes.some((n) => n.id === selectedNode.id);
  const vertexVisible = !!selectedVertexId && showBoundaries;

  // CAMERA FOCUS: node first, else vertex
  const focusPosition: [number, number, number] | null =
    selectedVisible && selectedNode
      ? selectedNode.position
      : vertexVisible && selectedVertexId
      ? getBoundaryPosition(selectedVertexId)
      : null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background:
          'radial-gradient(circle at top, #242424 0, #1E1E1E 45%, #050505 100%)',
      }}
    >
      {/* 3D viewport */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
          {/* lighting */}
          <ambientLight intensity={0.65} />
          <directionalLight position={[6, 6, 6]} intensity={0.9} />
          <directionalLight position={[-4, -3, -5]} intensity={0.3} />

          {/* 3D spacetime grid */}
          <SpacetimeGrid visible={showGrid} />

          {/* ---- AXES + BOUNDARY HULL (separate toggles) ---- */}

          {/* Axis lines (dashed) */}
          {showAxes &&
            AXIS_LINES.map(([a, b]) => {
              const pa = getBoundaryPosition(a);
              const pb = getBoundaryPosition(b);
              return (
                <Line
                  key={`axis-${a}-${b}`}
                  points={[pa, pb]}
                  color="#777777"
                  lineWidth={1}
                  dashed
                  dashSize={0.25}
                  gapSize={0.2}
                />
              );
            })}

          {/* Cuboctahedron hull edges + vertex markers */}
          {showBoundaries && (
            <>
              {HULL_EDGES.map(([a, b]) => {
                const pa = getBoundaryPosition(a);
                const pb = getBoundaryPosition(b);
                return (
                  <Line
                    key={`edge-${a}-${b}`}
                    points={[pa, pb]}
                    color="#334444"
                    lineWidth={1}
                    transparent
                    opacity={0.8}
                  />
                );
              })}

              {BOUNDARY_VERTICES.map((v) => {
                const isHovered = hoveredVertexId === v.id;
                const isSelected = selectedVertexId === v.id;

                const baseColor = getVertexBaseColor(v.id);

                const radius = isSelected
                  ? 0.11
                  : isHovered
                  ? 0.085
                  : 0.06;

                const emissiveColor = isSelected
                  ? baseColor
                  : isHovered
                  ? '#ffffff'
                  : baseColor;

                const emissiveIntensity = isSelected
                  ? 1.0
                  : isHovered
                  ? 0.7
                  : 0.5;

                return (
                  <mesh
                    key={v.id}
                    position={v.position}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedVertexId(v.id);
                      setSelectedId(null);
                    }}
                    onPointerOver={(event) => {
                      event.stopPropagation();
                      setHoveredVertexId(v.id);
                    }}
                    onPointerOut={(event) => {
                      event.stopPropagation();
                      setHoveredVertexId((current) =>
                        current === v.id ? null : current
                      );
                    }}
                  >
                    <sphereGeometry args={[radius, 16, 16]} />
                    <meshStandardMaterial
                      color={baseColor}
                      emissive={emissiveColor}
                      emissiveIntensity={emissiveIntensity}
                      metalness={0.2}
                      roughness={0.3}
                    />
                  </mesh>
                );
              })}
            </>
          )}

          {/* Highlight cylinder for selected axis (independent of axis-line toggle) */}
          {selectedVertex && (
            <AxisCylinder
              startId={selectedVertex.id}
              endId={selectedVertex.oppositeId}
              group={selectedVertex.group}
            />
          )}

          {/* GENRE CLOUDS (Ambient / Synthwave / House) */}
          {GENRE_REGIONS.map((region) => {
            const points = REGION_POINT_CLOUDS[region.id] || [];
            const color = getRegionColor(region);

            return (
              <React.Fragment key={region.id}>
                {points.map((pos, idx) => (
                  <mesh
                    key={`${region.id}-pt-${idx}`}
                    position={pos}
                    raycast={null as any}
                  >
                    <sphereGeometry args={[0.035, 10, 10]} />
                    <meshStandardMaterial
                      color={color}
                      emissive={color}
                      emissiveIntensity={0.15}
                      transparent
                      opacity={0.25}
                      roughness={0.3}
                      metalness={0.1}
                      depthWrite={false}
                    />
                  </mesh>
                ))}
              </React.Fragment>
            );
          })}

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
                  setSelectedVertexId(null);
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

          <CameraRig focusPosition={focusPosition} />
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
          boxShadow: '0 0 22px rgba(0,0,0,0.6)',
        }}
      >
        {/* Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.8,
              color: '#00FF00',
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
              outline: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.35rem',
            }}
          >
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'high-energy' as const, label: 'High Energy' },
              { id: 'groove' as const, label: 'Groove / Dance' },
              { id: 'dreamy' as const, label: 'Dreamy / Chill' },
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
                    cursor: 'pointer',
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
              opacity: 0.65,
            }}
          >
            Showing {filteredNodes.length} / {GOOF_NODES.length} nodes.
          </div>

          {/* Grid / Axis / Boundary toggles */}
          <div
            style={{
              marginTop: '0.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {/* Grid toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  opacity: 0.75,
                }}
              >
                Show space-time grid
              </span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  style={{ accentColor: '#00FF00' }}
                />
                <span>{showGrid ? 'On' : 'Off'}</span>
              </label>
            </div>

            {/* Axis toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  opacity: 0.75,
                }}
              >
                Show axis lines
              </span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={showAxes}
                  onChange={(e) => setShowAxes(e.target.checked)}
                  style={{ accentColor: '#00FF00' }}
                />
                <span>{showAxes ? 'On' : 'Off'}</span>
              </label>
            </div>

            {/* Boundary hull toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  opacity: 0.75,
                }}
              >
                Show boundary hull
              </span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={showBoundaries}
                  onChange={(e) => setShowBoundaries(e.target.checked)}
                  style={{ accentColor: '#00FF00' }}
                />
                <span>{showBoundaries ? 'On' : 'Off'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Selection details (node OR vertex) */}
        <div
          style={{
            marginTop: '0.4rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '0.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            flexGrow: 1,
          }}
        >
          <div
            style={{
              opacity: 0.8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              color: '#00FF00',
            }}
          >
            Selection Details
          </div>

          {selectedNode ? (
            // --- NODE DETAIL VIEW ---
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
                    gap: '0.35rem',
                  }}
                >
                  <span>{selectedNode.name}</span>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: getNodeBaseColor(selectedNode),
                      boxShadow: `0 0 12px ${getNodeBaseColor(selectedNode)}`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.75,
                  }}
                >
                  {selectedNode.genre}
                </div>
              </div>

              <p
                style={{
                  lineHeight: 1.4,
                  opacity: 0.9,
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
                  gap: '0.4rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.8,
                  }}
                >
                  Example track:
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
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
                          'radial-gradient(circle, rgba(0,255,0,0.2) 0, transparent 70%)',
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
                          'radial-gradient(circle, rgba(119,50,217,0.26) 0, transparent 70%)',
                      }}
                    >
                      Open on YouTube
                    </a>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setSelectedVertexId(null);
                }}
                style={{
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'transparent',
                  color: '#dddddd',
                  cursor: 'pointer',
                }}
              >
                Clear selection
              </button>
            </>
          ) : selectedVertex ? (
            // --- VERTEX (AXIS) DETAIL VIEW ---
            <>
              <div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    marginBottom: '0.15rem',
                    textTransform: 'uppercase',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                  }}
                >
                  <span>{selectedVertex.title}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      opacity: 0.8,
                      color: '#aaaaaa',
                    }}
                  >
                    {selectedVertex.group} · {selectedVertex.dimension}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.8rem',
                    opacity: 0.85,
                  }}
                >
                  <strong>{selectedVertex.axisLabel}</strong>{' '}
                </div>
              </div>

              <p
                style={{
                  lineHeight: 1.4,
                  opacity: 0.9,
                }}
              >
                {selectedVertex.description}
              </p>

              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: '0.6rem',
                  marginTop: '0.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.8,
                  }}
                >
                  Example genres:
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    opacity: 0.9,
                  }}
                >
                  {selectedVertex.exampleGenres}
                </div>
              </div>

              {selectedVertex.oppositeId && (
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '0.6rem',
                    marginTop: '0.2rem',
                    fontSize: '0.75rem',
                    opacity: 0.85,
                    lineHeight: 1.4,
                  }}
                >
                  <div
                    style={{
                      marginBottom: '0.15rem',
                      opacity: 0.8,
                    }}
                  >
                    Opposite end of this axis:
                  </div>
                  <div>
                    <strong>
                      {VERTEX_INFO[selectedVertex.oppositeId].title}
                    </strong>{' '}
                    ({VERTEX_INFO[selectedVertex.oppositeId].axisLabel})
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedVertexId(null)}
                style={{
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'transparent',
                  color: '#dddddd',
                  cursor: 'pointer',
                }}
              >
                Clear selection
              </button>
            </>
          ) : (
            // --- DEFAULT HELP TEXT ---
            <div
              style={{
                opacity: 0.75,
                lineHeight: 1.4,
              }}
            >
              Click a{' '}
              <span style={{ fontStyle: 'italic', color: '#00FF00' }}>
                genre node
              </span>{' '}
              to inspect its GOOF signature, or click a{' '}
              <span style={{ fontStyle: 'italic', color: '#009DFF' }}>
                axis vertex
              </span>{' '}
              to see what musical quality that corner of the nebula encodes.
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
            opacity: 0.8,
          }}
        >
          <div
            style={{
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              marginBottom: '0.4rem',
              color: '#aaaaaa',
            }}
          >
            Legend
          </div>

          {/* Node family legend */}
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              marginBottom: '0.45rem',
              flexWrap: 'wrap',
            }}
          >
            <LegendSwatch color="#00FF00" label="High Energy" />
            <LegendSwatch color="#66FF66" label="Groove / Dance" />
            <LegendSwatch color="#7732D9" label="Dreamy / Chill" />
          </div>

          <div
            style={{
              lineHeight: 1.4,
              marginBottom: '0.6rem',
            }}
          >
            <strong>Size</strong> = composite energy (tempo, rhythmic
            complexity, temperature, synthetic-ness).
            <br />
            <strong>Position</strong> encodes the 6-axis GOOF signature
            (Tempo, Tonality, Timbre) in 3D space.
          </div>

          {/* Axis legend strip */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div
              style={{
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontSize: '0.68rem',
                color: '#aaaaaa',
              }}
            >
              Axis Dimensions
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <LegendSwatch color="#FFB347" label="Tempo" />
                <span
                  style={{
                    fontSize: '0.7rem',
                    opacity: 0.85,
                  }}
                >
                  Rhythm Speed · Rhythm Complexity
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <LegendSwatch color="#7732D9" label="Tonality" />
                <span
                  style={{
                    fontSize: '0.7rem',
                    opacity: 0.85,
                  }}
                >
                  Harmonic Quality · Harmonic Density
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <LegendSwatch color="#009DFF" label="Timbre" />
                <span
                  style={{
                    fontSize: '0.7rem',
                    opacity: 0.85,
                  }}
                >
                  Sonic Temperature · Synthetic Value
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Tiny helper component for legend color dots
function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '999px',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
