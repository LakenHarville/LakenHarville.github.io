import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * RainforestEnvironment — The Living World
 * 
 * This component builds the entire rainforest scene from primitives.
 * No external 3D models — everything is constructed from basic Three.js
 * geometries (spheres, cylinders, cones, planes) composed together.
 * 
 * COMPOSITION OVER COMPLEXITY:
 * A realistic-looking tree is just a brown cylinder (trunk) topped with 
 * several overlapping green spheres (canopy). From a distance, your brain 
 * fills in the details. This is the same technique used in low-poly games 
 * and early 3D platformers — shapes suggest form, lighting sells it.
 * 
 * PROCEDURAL PLACEMENT:
 * Trees, ferns, and rocks use pre-computed arrays of positions. We use 
 * `useMemo` to calculate these ONCE and cache them, rather than 
 * recalculating every render. Think of it like pre-cutting all your 
 * ingredients before cooking — prep once, use repeatedly.
 * 
 * THE RIVER:
 * The river is a series of flat blue planes arranged in a winding path.
 * We animate a subtle wave effect using vertex displacement in the shader,
 * but for simplicity here we use animated opacity and a gentle float.
 */

function TropicalTree({ position, scale = 1, trunkHeight = 4, canopySize = 2.5 }) {
  /**
   * Single Tropical Tree — composed from primitives.
   * 
   * Anatomy:
   * - Trunk: Tapered cylinder (wider at base) with bark-brown color
   * - Canopy: 3-4 overlapping spheres with slight randomness
   * - Vines: Thin cylinders draping from canopy (optional, adds detail)
   * - Roots: Small cylinders flaring out at the base
   */
  const canopyColor = useMemo(() => {
    const greens = ['#1a5a2a', '#1d6b30', '#2a7a3a', '#1a6a28', '#236b2d']
    return greens[Math.floor(Math.random() * greens.length)]
  }, [])

  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.4, trunkHeight, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </mesh>

      {/* Exposed roots */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <mesh
          key={`root-${i}`}
          position={[Math.cos(angle) * 0.5, 0.2, Math.sin(angle) * 0.5]}
          rotation={[0.5 * Math.sin(angle), angle, 0.3]}
          castShadow
        >
          <cylinderGeometry args={[0.05, 0.1, 0.8, 5]} />
          <meshStandardMaterial color="#3d2817" roughness={0.95} />
        </mesh>
      ))}

      {/* Canopy — multiple overlapping spheres for fullness */}
      {[
        [0, trunkHeight + 0.5, 0, canopySize],
        [0.8, trunkHeight + 0.2, 0.6, canopySize * 0.7],
        [-0.6, trunkHeight + 0.3, -0.5, canopySize * 0.75],
        [0.3, trunkHeight + 0.8, -0.7, canopySize * 0.6],
        [-0.4, trunkHeight - 0.1, 0.8, canopySize * 0.65],
      ].map(([x, y, z, s], i) => (
        <mesh key={`canopy-${i}`} position={[x, y, z]} castShadow>
          <sphereGeometry args={[s, 12, 10]} />
          <meshStandardMaterial
            color={canopyColor}
            roughness={0.8}
            metalness={0.0}
          />
        </mesh>
      ))}

      {/* Hanging vines */}
      {[
        [0.6, trunkHeight, 0.4, 2.5],
        [-0.5, trunkHeight - 0.3, -0.6, 3],
        [0.2, trunkHeight + 0.2, -0.8, 2],
      ].map(([x, y, z, len], i) => (
        <mesh key={`vine-${i}`} position={[x, y - len / 2, z]}>
          <cylinderGeometry args={[0.015, 0.02, len, 4]} />
          <meshStandardMaterial color="#2a5a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Fern({ position, scale = 1 }) {
  /** A ground fern — radiating fronds from a central point */
  return (
    <group position={position} scale={scale}>
      {[0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.3, 0.25, Math.sin(angle) * 0.3]}
          rotation={[0.6, angle, 0]}
        >
          <planeGeometry args={[0.15, 0.6]} />
          <meshStandardMaterial
            color="#1a6a2a"
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

function RiverSegment({ position, width = 3, length = 6, rotation = 0 }) {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      // Subtle wave shimmer
      ref.current.material.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.08
    }
  })

  return (
    <mesh
      ref={ref}
      position={[position[0], 0.03, position[2]]}
      rotation={[-Math.PI / 2, 0, rotation]}
      receiveShadow
    >
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial
        color="#1a6a7a"
        roughness={0.2}
        metalness={0.5}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

function RainforestEnvironment() {
  /**
   * Environment layout — the forest is divided into zones:
   * 
   * - Dense tree clusters at the edges (creates "walls")
   * - A winding river through the middle
   * - Open clearings where portals/interactive objects live
   * - Scattered vegetation throughout
   * - Atmospheric fog and lighting
   */

  // Pre-compute tree positions (edges and clusters)
  const trees = useMemo(() => [
    // North tree line
    { pos: [-18, 0, -20], scale: 1.2, height: 5 },
    { pos: [-12, 0, -22], scale: 1.0, height: 4.5 },
    { pos: [-6, 0, -21], scale: 1.3, height: 6 },
    { pos: [0, 0, -23], scale: 1.1, height: 5 },
    { pos: [6, 0, -20], scale: 1.4, height: 5.5 },
    { pos: [12, 0, -22], scale: 1.0, height: 4 },
    { pos: [18, 0, -21], scale: 1.2, height: 5.5 },
    // South tree line
    { pos: [-16, 0, 20], scale: 1.1, height: 4.5 },
    { pos: [-8, 0, 22], scale: 1.3, height: 5 },
    { pos: [4, 0, 21], scale: 1.0, height: 5.5 },
    { pos: [14, 0, 20], scale: 1.2, height: 4 },
    { pos: [20, 0, 22], scale: 1.1, height: 5 },
    // East tree line
    { pos: [22, 0, -14], scale: 1.3, height: 5.5 },
    { pos: [21, 0, -6], scale: 1.0, height: 4 },
    { pos: [23, 0, 2], scale: 1.2, height: 5 },
    { pos: [21, 0, 10], scale: 1.1, height: 6 },
    // West tree line
    { pos: [-22, 0, -10], scale: 1.2, height: 5 },
    { pos: [-21, 0, -2], scale: 1.4, height: 5.5 },
    { pos: [-23, 0, 6], scale: 1.0, height: 4.5 },
    { pos: [-20, 0, 14], scale: 1.3, height: 5 },
    // Interior clusters
    { pos: [-10, 0, -8], scale: 0.9, height: 4 },
    { pos: [10, 0, -10], scale: 1.0, height: 4.5 },
    { pos: [-8, 0, 12], scale: 0.8, height: 3.5 },
    { pos: [12, 0, 8], scale: 0.9, height: 4 },
    { pos: [5, 0, -14], scale: 1.1, height: 5 },
    { pos: [-14, 0, 5], scale: 1.0, height: 4.5 },
    { pos: [16, 0, -4], scale: 0.85, height: 3.5 },
    { pos: [-4, 0, -16], scale: 1.0, height: 4 },
  ], [])

  const ferns = useMemo(() => [
    [-5, 0, 3], [7, 0, -5], [-3, 0, -10], [9, 0, 6],
    [-12, 0, 8], [3, 0, 14], [-7, 0, -14], [15, 0, -8],
    [11, 0, 14], [-15, 0, -6], [1, 0, -3], [-9, 0, 15],
    [6, 0, 10], [-11, 0, -12], [14, 0, 2], [-2, 0, 8],
    [8, 0, -12], [-6, 0, 16], [17, 0, 12], [-17, 0, 10],
  ], [])

  // River path — winding from top-left to bottom-right
  const riverSegments = useMemo(() => [
    { pos: [-16, 0, -15], width: 3.5, length: 8, rot: 0.3 },
    { pos: [-12, 0, -10], width: 3, length: 7, rot: 0.5 },
    { pos: [-8, 0, -5], width: 3.5, length: 8, rot: 0.2 },
    { pos: [-4, 0, 0], width: 3, length: 7, rot: -0.1 },
    { pos: [0, 0, 4], width: 3.5, length: 8, rot: -0.3 },
    { pos: [5, 0, 8], width: 3, length: 7, rot: -0.2 },
    { pos: [10, 0, 12], width: 3.5, length: 8, rot: -0.4 },
    { pos: [15, 0, 16], width: 3, length: 7, rot: -0.1 },
  ], [])

  // Rocks scattered around
  const rocks = useMemo(() => {
    const r = []
    for (let i = 0; i < 25; i++) {
      r.push({
        pos: [(Math.random() - 0.5) * 44, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 44],
        size: 0.2 + Math.random() * 0.4,
        rot: [Math.random() * 0.5, Math.random() * Math.PI * 2, 0],
      })
    }
    return r
  }, [])

  return (
    <group>
      {/* ======== GROUND ======== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[55, 55]} />
        <meshStandardMaterial color="#3a6a28" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Forest floor detail — darker patches */}
      {[
        [-5, 3], [8, -7], [-12, 10], [6, 15], [-8, -12],
        [14, -3], [-3, 7], [10, 10], [-15, -8], [2, -15],
      ].map(([x, z], i) => (
        <mesh key={`patch-${i}`} rotation={[-Math.PI / 2, 0, Math.random()]} position={[x, 0.01, z]} receiveShadow>
          <circleGeometry args={[1.5 + Math.random() * 2, 12]} />
          <meshStandardMaterial color="#1a3a12" roughness={1} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* ======== RIVER ======== */}
      {riverSegments.map((seg, i) => (
        <RiverSegment
          key={`river-${i}`}
          position={seg.pos}
          width={seg.width}
          length={seg.length}
          rotation={seg.rot}
        />
      ))}

      {/* River bank highlights */}
      {riverSegments.map((seg, i) => (
        <mesh
          key={`bank-${i}`}
          position={[seg.pos[0], 0.02, seg.pos[2]]}
          rotation={[-Math.PI / 2, 0, seg.rot]}
          receiveShadow
        >
          <planeGeometry args={[seg.width + 1.5, seg.length + 0.5]} />
          <meshStandardMaterial color="#1e3a20" roughness={0.9} />
        </mesh>
      ))}

      {/* ======== TREES ======== */}
      {trees.map((t, i) => (
        <TropicalTree
          key={`tree-${i}`}
          position={t.pos}
          scale={t.scale}
          trunkHeight={t.height}
          canopySize={t.scale * 2.2}
        />
      ))}

      {/* ======== FERNS ======== */}
      {ferns.map((pos, i) => (
        <Fern key={`fern-${i}`} position={pos} scale={0.6 + Math.random() * 0.6} />
      ))}

      {/* ======== ROCKS ======== */}
      {rocks.map((r, i) => (
        <mesh key={`rock-${i}`} position={r.pos} rotation={r.rot} castShadow>
          <dodecahedronGeometry args={[r.size, 0]} />
          <meshStandardMaterial color="#3a4a3e" roughness={0.95} />
        </mesh>
      ))}

      {/* ======== FALLEN LOGS (decoration) ======== */}
      {[
        { pos: [6, 0.2, -8], rot: [0, 0.8, Math.PI / 2], len: 3 },
        { pos: [-10, 0.2, 4], rot: [0, -0.4, Math.PI / 2], len: 4 },
        { pos: [14, 0.15, 12], rot: [0, 1.2, Math.PI / 2], len: 2.5 },
      ].map((log, i) => (
        <group key={`log-${i}`} position={log.pos} rotation={log.rot}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.25, log.len, 8]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
          </mesh>
          {/* Moss patches on log */}
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[0, 0.18, (j - 1) * 0.6]} rotation={[0, j, 0]}>
              <sphereGeometry args={[0.15, 6, 6]} />
              <meshStandardMaterial color="#1a5a1a" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ======== TALL GRASS tufts ======== */}
      {[
        [-2, 0, -5], [4, 0, 2], [-6, 0, 8], [8, 0, -3],
        [-10, 0, -14], [12, 0, 5], [-4, 0, 12], [16, 0, -10],
        [3, 0, 17], [-14, 0, 14], [18, 0, 8], [-16, 0, -3],
      ].map((pos, i) => (
        <group key={`grass-${i}`} position={pos}>
          {[0, 0.4, 0.8, 1.2, 1.6, 2.0].map((angle, j) => (
            <mesh key={j} position={[Math.cos(angle) * 0.15, 0.3, Math.sin(angle) * 0.15]} rotation={[0.1 * Math.sin(angle), angle, 0]}>
              <planeGeometry args={[0.06, 0.6]} />
              <meshStandardMaterial color="#1a5a2a" side={THREE.DoubleSide} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ======== FIREFLIES (floating particles) ======== */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Float
          key={`firefly-${i}`}
          speed={1 + Math.random() * 2}
          floatIntensity={0.5 + Math.random() * 0.5}
          rotationIntensity={0}
        >
          <mesh position={[
            (Math.random() - 0.5) * 40,
            1 + Math.random() * 4,
            (Math.random() - 0.5) * 40
          ]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial
              color="#aaff44"
              emissive="#aaff44"
              emissiveIntensity={2}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

export default RainforestEnvironment
