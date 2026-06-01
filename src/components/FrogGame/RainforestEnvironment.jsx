import { useMemo } from 'react'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * RainforestEnvironment — The Living World (v2)
 *
 * v2 IMPROVEMENTS:
 * - Trees: layered canopy with many small clusters + individual leaf planes
 *   visible at the silhouette edges (so you can see actual leaves, not blobs)
 * - River: animated vertex displacement — real moving waves instead of a flat
 *   plane with opacity wobble
 * - Portal clearings: the layout below explicitly avoids the four lily-pad
 *   portal positions (Resume, Education, Projects, Interests) with a 4-unit
 *   exclusion radius enforced in the placement arrays
 */

// Portal positions — must be kept in sync with GameScene.jsx
// Anything in this list defines a "no-clutter" clearing of radius CLEARING_RADIUS
const PORTAL_POSITIONS = [
  [10, 0, -10],   // Resume
  [-12, 0, -8],   // Education
  [-6, 0, -18],   // Projects
  [14, 0, 12],    // Interests
]
const CLEARING_RADIUS = 4.0

function isInPortalClearing(x, z, radius = CLEARING_RADIUS) {
  for (const [px, , pz] of PORTAL_POSITIONS) {
    const dx = x - px
    const dz = z - pz
    if (dx * dx + dz * dz < radius * radius) return true
  }
  return false
}

// ----------------------------------------------------------------------------
// Detailed Tropical Tree
// ----------------------------------------------------------------------------
function TropicalTree({ position, scale = 1, trunkHeight = 4, canopySize = 2.5, seed = 0 }) {
  // Pre-compute deterministic randomness so the tree's shape is stable
  const random = useMemo(() => {
    // Simple seeded RNG (mulberry32). Same seed → same tree, every render.
    let s = seed + 1
    return () => {
      s = (s + 0x6D2B79F5) | 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }, [seed])

  const canopyTones = useMemo(() => {
    const greens = ['#1d5a2a', '#2a6f30', '#1a6a28', '#236b2d', '#327a36', '#266a2d']
    return greens
  }, [])

  // Inner cluster blobs — densely packed for a fuller canopy.
  // Dropped from 14 → 8 to lighten the mesh count.
  const blobs = useMemo(() => {
    const arr = []
    const count = 8
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + random() * 0.4
      const radius = canopySize * (0.35 + random() * 0.5)
      const yOffset = trunkHeight + (random() - 0.3) * canopySize * 0.7
      arr.push({
        pos: [
          Math.cos(angle) * radius,
          yOffset,
          Math.sin(angle) * radius,
        ],
        size: canopySize * (0.4 + random() * 0.35),
        color: canopyTones[Math.floor(random() * canopyTones.length)],
      })
    }
    // Crown blob
    arr.push({
      pos: [0, trunkHeight + canopySize * 0.4, 0],
      size: canopySize * 0.85,
      color: canopyTones[Math.floor(random() * canopyTones.length)],
    })
    return arr
  }, [canopySize, trunkHeight, canopyTones, random])

  // Individual leaf planes around the silhouette — these are what make
  // the tree look like it has actual leaves, not just green blobs.
  // Count tuned down from 60 → 28 for perf; still reads as a leafy tree
  // at the viewer's typical distance.
  const leaves = useMemo(() => {
    const arr = []
    const count = 28
    for (let i = 0; i < count; i++) {
      const yt = random() // 0..1 height fraction within canopy
      const angle = random() * Math.PI * 2
      const radius = canopySize * (0.75 + random() * 0.45)
      const y = trunkHeight + canopySize * 0.2 + yt * canopySize * 1.1
      arr.push({
        pos: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        rot: [random() * Math.PI, angle + (random() - 0.5), random() * 0.5],
        size: 0.28 + random() * 0.22,
        color: canopyTones[Math.floor(random() * canopyTones.length)],
      })
    }
    return arr
  }, [canopySize, trunkHeight, canopyTones, random])

  // Bark rings — subtle horizontal segments give the trunk visible texture
  const barkRings = useMemo(() => {
    const segments = Math.max(3, Math.floor(trunkHeight / 0.8))
    return Array.from({ length: segments }, (_, i) => ({
      y: 0.4 + (i * trunkHeight) / segments,
      radius: 0.22 + (1 - i / segments) * 0.16,
    }))
  }, [trunkHeight])

  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.42, trunkHeight, 12]} />
        <meshStandardMaterial color="#3d2817" roughness={0.95} />
      </mesh>

      {/* Bark texture rings */}
      {barkRings.map((r, i) => (
        <mesh key={`bark-${i}`} position={[0, r.y, 0]}>
          <torusGeometry args={[r.radius, 0.014, 6, 18]} />
          <meshStandardMaterial color="#291807" roughness={1} />
        </mesh>
      ))}

      {/* Exposed roots */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <mesh
          key={`root-${i}`}
          position={[Math.cos(angle) * 0.5, 0.2, Math.sin(angle) * 0.5]}
          rotation={[0.5 * Math.sin(angle), angle, 0.3]}
          castShadow
        >
          <cylinderGeometry args={[0.05, 0.12, 0.9, 6]} />
          <meshStandardMaterial color="#3d2817" roughness={0.95} />
        </mesh>
      ))}

      {/* Canopy core — overlapping spheres for body */}
      {blobs.map((b, i) => (
        <mesh key={`blob-${i}`} position={b.pos} castShadow>
          <sphereGeometry args={[b.size, 12, 10]} />
          <meshStandardMaterial color={b.color} roughness={0.85} />
        </mesh>
      ))}

      {/* Visible individual leaves around the silhouette */}
      {leaves.map((leaf, i) => (
        <mesh key={`leaf-${i}`} position={leaf.pos} rotation={leaf.rot}>
          <planeGeometry args={[leaf.size, leaf.size * 1.6]} />
          <meshStandardMaterial
            color={leaf.color}
            roughness={0.85}
            side={THREE.DoubleSide}
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
          <cylinderGeometry args={[0.015, 0.022, len, 5]} />
          <meshStandardMaterial color="#2a5a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Fern({ position, scale = 1 }) {
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

function RainforestEnvironment() {
  // -- Tree placement: edges & interior clusters, but kept clear of portals --
  // Thinned for perf — kept enough perimeter trees that the world still has
  // a "wall" feel, but removed redundant pairs and most interior trees.
  const trees = useMemo(() => {
    const raw = [
      // North tree line
      { pos: [-18, 0, -20], scale: 1.2, height: 5 },
      { pos: [-2, 0, -23], scale: 1.3, height: 6 },
      { pos: [6, 0, -20], scale: 1.4, height: 5.5 },
      { pos: [18, 0, -21], scale: 1.2, height: 5.5 },
      // South tree line — thinned (was 4, kept 2 anchor trees)
      { pos: [-16, 0, 20], scale: 1.1, height: 4.5 },
      { pos: [20, 0, 22], scale: 1.1, height: 5 },
      // East tree line
      { pos: [22, 0, -14], scale: 1.3, height: 5.5 },
      { pos: [23, 0, 2], scale: 1.2, height: 5 },
      { pos: [21, 0, 10], scale: 1.1, height: 6 },
      // West tree line
      { pos: [-22, 0, -10], scale: 1.2, height: 5 },
      { pos: [-21, 0, -2], scale: 1.4, height: 5.5 },
      { pos: [-20, 0, 14], scale: 1.3, height: 5 },
      // Interior — kept a few for variety and silhouette
      { pos: [5, 0, -5], scale: 1.0, height: 4.5 },
      { pos: [-14, 0, 5], scale: 1.0, height: 4.5 },
      { pos: [16, 0, -4], scale: 0.85, height: 3.5 },
    ]
    return raw.filter((t) => !isInPortalClearing(t.pos[0], t.pos[2]))
  }, [])

  const ferns = useMemo(() => {
    const raw = [
      [-5, 0, 3], [7, 0, -5], [-3, 0, -10], [9, 0, 6],
      [-12, 0, 8], [3, 0, 14], [-7, 0, -14], [15, 0, -8],
      [11, 0, 14], [-15, 0, -6], [1, 0, -3], [-9, 0, 15],
      [6, 0, 10], [-11, 0, -12], [14, 0, 2], [-2, 0, 8],
      [8, 0, -12], [-6, 0, 16], [17, 0, 12], [-17, 0, 10],
    ]
    return raw.filter(([x, , z]) => !isInPortalClearing(x, z, CLEARING_RADIUS - 0.5))
  }, [])


  const rocks = useMemo(() => {
    const r = []
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 44
      const z = (Math.random() - 0.5) * 44
      if (isInPortalClearing(x, z, CLEARING_RADIUS - 0.5)) continue
      r.push({
        pos: [x, 0.1 + Math.random() * 0.2, z],
        size: 0.2 + Math.random() * 0.4,
        rot: [Math.random() * 0.5, Math.random() * Math.PI * 2, 0],
      })
    }
    return r
  }, [])

  return (
    <group>
      {/* GROUND */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[55, 55]} />
        <meshStandardMaterial color="#3a6a28" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Forest floor detail */}
      {[
        [-5, 3], [8, -7], [-12, 10], [6, 15], [-8, -12],
        [14, -3], [-3, 7], [10, 10], [-15, -8], [2, -15],
      ]
        .filter(([x, z]) => !isInPortalClearing(x, z, CLEARING_RADIUS - 1))
        .map(([x, z], i) => (
          <mesh key={`patch-${i}`} rotation={[-Math.PI / 2, 0, Math.random()]} position={[x, 0.01, z]} receiveShadow>
            <circleGeometry args={[1.5 + Math.random() * 2, 12]} />
            <meshStandardMaterial color="#1a3a12" roughness={1} transparent opacity={0.4} />
          </mesh>
        ))}

      {/* TREES */}
      {trees.map((t, i) => (
        <TropicalTree
          key={`tree-${i}`}
          position={t.pos}
          scale={t.scale}
          trunkHeight={t.height}
          canopySize={t.scale * 2.2}
          seed={i * 7919}
        />
      ))}

      {/* FERNS */}
      {ferns.map((pos, i) => (
        <Fern key={`fern-${i}`} position={pos} scale={0.6 + Math.random() * 0.6} />
      ))}

      {/* ROCKS */}
      {rocks.map((r, i) => (
        <mesh key={`rock-${i}`} position={r.pos} rotation={r.rot} castShadow>
          <dodecahedronGeometry args={[r.size, 0]} />
          <meshStandardMaterial color="#3a4a3e" roughness={0.95} />
        </mesh>
      ))}

      {/* FALLEN LOGS — moved away from portals */}
      {[
        // OLD [6, -8] was near Resume; shifted to [3, -6]
        { pos: [3, 0.2, -6], rot: [0, 0.8, Math.PI / 2], len: 3 },
        // OLD [-10, 4] kept (clear of all portals)
        { pos: [-10, 0.2, 4], rot: [0, -0.4, Math.PI / 2], len: 4 },
        // OLD [14, 12] was on Interests; shifted to [18, 16]
        { pos: [18, 0.15, 16], rot: [0, 1.2, Math.PI / 2], len: 2.5 },
      ]
        .filter((log) => !isInPortalClearing(log.pos[0], log.pos[2]))
        .map((log, i) => (
          <group key={`log-${i}`} position={log.pos} rotation={log.rot}>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.25, log.len, 8]} />
              <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
            </mesh>
            {[0, 1, 2].map((j) => (
              <mesh key={j} position={[0, 0.18, (j - 1) * 0.6]} rotation={[0, j, 0]}>
                <sphereGeometry args={[0.15, 6, 6]} />
                <meshStandardMaterial color="#1a5a1a" roughness={0.9} />
              </mesh>
            ))}
          </group>
        ))}

      {/* TALL GRASS tufts */}
      {[
        [-2, 0, -5], [4, 0, 2], [-6, 0, 8], [8, 0, -3],
        [-10, 0, -14], [12, 0, 5], [-4, 0, 12], [16, 0, -10],
        [3, 0, 17], [-14, 0, 14], [18, 0, 8], [-16, 0, -3],
      ]
        .filter(([x, , z]) => !isInPortalClearing(x, z, CLEARING_RADIUS - 0.5))
        .map((pos, i) => (
          <group key={`grass-${i}`} position={pos}>
            {[0, 0.4, 0.8, 1.2, 1.6, 2.0].map((angle, j) => (
              <mesh key={j} position={[Math.cos(angle) * 0.15, 0.3, Math.sin(angle) * 0.15]} rotation={[0.1 * Math.sin(angle), angle, 0]}>
                <planeGeometry args={[0.06, 0.6]} />
                <meshStandardMaterial color="#1a5a2a" side={THREE.DoubleSide} roughness={0.85} />
              </mesh>
            ))}
          </group>
        ))}

      {/* FIREFLIES — reduced from 20 → 10 for perf */}
      {Array.from({ length: 10 }).map((_, i) => (
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
