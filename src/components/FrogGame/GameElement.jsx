import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import * as THREE from 'three'

/**
 * GameElement — Lily Pad Portal
 * 
 * Each portfolio section is represented by a lily pad floating on a 
 * clearing in the rainforest. The lily pad has:
 * 
 * 1. A large, slightly curved disc (the pad itself) — green with veining
 * 2. A small flower blooming from one edge (colored to match the section)
 * 3. A glowing text label floating above
 * 4. A pulsing ring of light on the ground beneath
 * 5. A point light that illuminates the area, drawing the player in
 * 
 * VISUAL ATTRACTION:
 * The glow and floating motion serve a game-design purpose — they draw 
 * the player's eye across the environment. In level design this is called 
 * "wayfinding through lighting." Players naturally move toward bright 
 * things in dark environments, like moths to a flame.
 */
function GameElement({ name, position, color }) {
  const padRef = useRef()
  const flowerRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Gentle lily pad bob
    if (padRef.current) {
      padRef.current.rotation.y = time * 0.1
      padRef.current.position.y = 0.15 + Math.sin(time * 0.8) * 0.05
    }

    // Flower pulse
    if (flowerRef.current) {
      const pulse = Math.sin(time * 2) * 0.15 + 1
      flowerRef.current.scale.setScalar(pulse)
    }

    // Ground glow pulse
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

      {/* Water puddle under the lily pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2, 24]} />
        <meshStandardMaterial
          color="#0a3a4a"
          roughness={0.2}
          metalness={0.5}
          transparent
          opacity={0.5}
        />
      </mesh>

      <Float speed={1.5} floatIntensity={0.3} rotationIntensity={0.05}>
        <group ref={padRef}>
          {/* ---- LILY PAD DISC ---- */}
          {/* Main pad — a flat cylinder with a notch (approximated) */}
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.4, 1.4, 0.08, 24]} />
            <meshStandardMaterial
              color="#1a6a2a"
              roughness={0.7}
              metalness={0.05}
            />
          </mesh>

          {/* Pad surface detail — slightly raised center vein */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[1.2, 1.3, 0.03, 20]} />
            <meshStandardMaterial
              color="#1d7a30"
              roughness={0.65}
            />
          </mesh>

          {/* Vein lines (radial ridges) */}
          {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5].map((angle, i) => (
            <mesh
              key={`vein-${i}`}
              position={[Math.cos(angle) * 0.5, 0.19, Math.sin(angle) * 0.5]}
              rotation={[-Math.PI / 2, 0, angle]}
            >
              <planeGeometry args={[0.03, 1.0]} />
              <meshStandardMaterial color="#148a28" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          ))}

          {/* Notch (the V-shaped cut in lily pads) — dark wedge */}
          <mesh position={[1.1, 0.2, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.7, 0.15, 0.35]} />
            <meshStandardMaterial color="#0a1a0d" roughness={0.95} />
          </mesh>

          {/* ---- FLOWER ---- */}
          <group ref={flowerRef} position={[-0.5, 0.35, 0.7]}>
            {/* Petals */}
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2
              return (
                <mesh
                  key={`petal-${i}`}
                  position={[Math.cos(angle) * 0.15, 0, Math.sin(angle) * 0.15]}
                  rotation={[-0.5, angle, 0]}
                >
                  <sphereGeometry args={[0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    roughness={0.4}
                  />
                </mesh>
              )
            })}
            {/* Flower center */}
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#f5e642" emissive="#f5e642" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>
      </Float>

      {/* ---- FLOATING LABEL ---- */}
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

      {/* Point light — draws the player toward this element */}
      <pointLight position={[0, 1.5, 0]} color={color} intensity={2.5} distance={8} />

      {/* Subtle upward glow particles (small emissive spheres) */}
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
