import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import * as THREE from 'three'

/**
 * GameElement — Lily Pad Portal (v2)
 *
 * v2 IMPROVEMENTS:
 * - Scalloped/ridged edge built from a custom ShapeGeometry so the pad has
 *   true wavy contours instead of a smooth cylinder rim
 * - Many more radial veins fanning out from the center
 * - Concentric inner-ring ridge for a subtle raised "lip"
 * - Small water droplets dotting the surface
 * - V-notch cut visualized as two tapered edge wedges rather than one box
 */

// Build a scalloped disc shape (Shape with bumps around its perimeter).
// We sample many angles and use a small sinusoidal bump on the radius to
// produce the gentle wavy edge that real lily pads have. The notch is
// approximated by collapsing the outer radius near angle = 0 so the V
// cut shows up as a dip in the silhouette.
function buildLilyPadShape(baseRadius = 1.4, bumpAmplitude = 0.07, bumpCount = 22, notchWidth = 0.35) {
  const shape = new THREE.Shape()
  const steps = 180
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = t * Math.PI * 2
    // Bumpy outer radius — sin wave around the rim
    let r = baseRadius + Math.sin(angle * bumpCount) * bumpAmplitude
    // V-notch: shrink radius near angle 0 (positive X axis)
    // notchFalloff smoothly cuts into the pad on the right side
    const distFromNotch = Math.min(
      Math.abs(angle),
      Math.abs(angle - Math.PI * 2)
    )
    if (distFromNotch < notchWidth) {
      const k = 1 - distFromNotch / notchWidth
      r -= k * baseRadius * 0.55
    }
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  return shape
}

function GameElement({ name, position, color }) {
  const padRef = useRef()
  const flowerRef = useRef()
  const glowRef = useRef()

  // Build the lily pad geometry once. Shape → ShapeGeometry produces a flat
  // mesh in the XY plane; we'll rotate -90° around X to lay it flat on the
  // ground like a real lily pad floating on water.
  const padGeo = useMemo(() => {
    const shape = buildLilyPadShape(1.45, 0.09, 20, 0.4)
    const geo = new THREE.ShapeGeometry(shape, 64)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  const padUnderGeo = useMemo(() => {
    const shape = buildLilyPadShape(1.5, 0.07, 20, 0.4)
    const geo = new THREE.ShapeGeometry(shape, 64)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  // Many radial veins — true detail like real lily pads
  const veins = useMemo(() => {
    const arr = []
    const count = 32
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      // Skip veins near the notch (right side)
      if (Math.abs(angle) < 0.35 || Math.abs(angle - Math.PI * 2) < 0.35) continue
      arr.push({ angle, length: 0.95 + (i % 3) * 0.1 })
    }
    return arr
  }, [])

  // Small water droplets on top of the pad
  const droplets = useMemo(() => [
    { pos: [0.4, 0.18, 0.2], size: 0.07 },
    { pos: [-0.3, 0.18, 0.5], size: 0.05 },
    { pos: [0.2, 0.18, -0.5], size: 0.06 },
    { pos: [-0.6, 0.18, -0.1], size: 0.04 },
    { pos: [0.1, 0.18, 0.65], size: 0.045 },
  ], [])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (padRef.current) {
      padRef.current.rotation.y = time * 0.1
      padRef.current.position.y = 0.15 + Math.sin(time * 0.8) * 0.05
    }
    if (flowerRef.current) {
      const pulse = Math.sin(time * 2) * 0.15 + 1
      flowerRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + Math.sin(time * 1.5) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Ground glow ring — visible from afar */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.5, 2.8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* ---- PORTAL POND ----
          A real pond beneath each portal lily pad so it visibly floats on
          water. Two layers: a darker outer mud rim and a reflective inner
          water surface. Radius is generous (3.2) so the pad sits in clear
          open water rather than floating on the grass. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
        <circleGeometry args={[3.4, 40]} />
        <meshStandardMaterial color="#1a2c14" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <circleGeometry args={[3.0, 40]} />
        <meshStandardMaterial
          color="#0e4a5a"
          roughness={0.2}
          metalness={0.55}
          transparent
          opacity={0.78}
        />
      </mesh>
      {/* Inner highlight (lighter water near the lily pad) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[1.9, 32]} />
        <meshStandardMaterial
          color="#1a7a8a"
          roughness={0.15}
          metalness={0.6}
          transparent
          opacity={0.45}
        />
      </mesh>

      <Float speed={1.5} floatIntensity={0.3} rotationIntensity={0.05}>
        <group ref={padRef}>
          {/* Underside (slightly larger, darker) */}
          <mesh position={[0, 0.1, 0]} receiveShadow geometry={padUnderGeo}>
            <meshStandardMaterial color="#0d4a18" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>

          {/* Main scalloped pad surface */}
          <mesh position={[0, 0.14, 0]} castShadow receiveShadow geometry={padGeo}>
            <meshStandardMaterial
              color="#1f7a32"
              roughness={0.65}
              metalness={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Raised inner lip — slightly smaller pad on top adds depth */}
          <mesh position={[0, 0.165, 0]}>
            <cylinderGeometry args={[1.05, 1.15, 0.022, 48]} />
            <meshStandardMaterial color="#268a36" roughness={0.55} />
          </mesh>

          {/* Center hub */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.025, 24]} />
            <meshStandardMaterial color="#327a30" roughness={0.5} />
          </mesh>

          {/* Radial veins fanning out from center */}
          {veins.map((v, i) => (
            <mesh
              key={`vein-${i}`}
              position={[
                Math.cos(v.angle) * (v.length * 0.5),
                0.172,
                Math.sin(v.angle) * (v.length * 0.5),
              ]}
              rotation={[-Math.PI / 2, 0, -v.angle]}
            >
              <planeGeometry args={[v.length, 0.025]} />
              <meshStandardMaterial
                color="#0f5a1e"
                roughness={0.7}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}

          {/* Water droplets glistening on the surface */}
          {droplets.map((d, i) => (
            <mesh key={`drop-${i}`} position={d.pos}>
              <sphereGeometry args={[d.size, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color="#9fdfee"
                roughness={0.05}
                metalness={0.4}
                transparent
                opacity={0.6}
              />
            </mesh>
          ))}

          {/* ---- FLOWER (unchanged proportions, slightly refined material) ---- */}
          <group ref={flowerRef} position={[-0.5, 0.35, 0.7]}>
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2
              return (
                <mesh
                  key={`petal-${i}`}
                  position={[Math.cos(angle) * 0.15, 0, Math.sin(angle) * 0.15]}
                  rotation={[-0.5, angle, 0]}
                >
                  <sphereGeometry args={[0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    roughness={0.4}
                  />
                </mesh>
              )
            })}
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.08, 10, 10]} />
              <meshStandardMaterial color="#f5e642" emissive="#f5e642" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>
      </Float>

      {/* FLOATING LABEL */}
      <Float speed={2} floatIntensity={0.2}>
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.4}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#000000"
        >
          {`Laken's ${name}`}
        </Text>
      </Float>

      {/* Point light */}
      <pointLight position={[0, 1.5, 0]} color={color} intensity={2.5} distance={8} />

      {/* Upward glow particles */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((offset, i) => (
        <Float key={`particle-${i}`} speed={3} floatIntensity={1} floatingRange={[0, 1.5]}>
          <mesh position={[
            Math.cos(offset) * 0.8,
            0.5 + i * 0.4,
            Math.sin(offset) * 0.8
          ]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={2}
              transparent
              opacity={0.7}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

export default GameElement
