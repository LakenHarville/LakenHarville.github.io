import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import * as THREE from 'three'

/**
 * INTERACTIVE OBJECTS
 * 
 * These are the "toys" scattered throughout the rainforest that make 
 * exploration rewarding. Each one has a unique interaction:
 * 
 * 1. GlowingMushroom — Changes the frog's color on contact
 * 2. TrampolinePad — A lily pad that bounces the frog high into the air
 * 3. ReedCluster — Tall reeds that reveal hidden messages when disturbed
 * 4. Puddle — Shallow water that ripples and reveals creatures
 * 5. MossyLogBridge — A log crossing over the river
 * 
 * Each object uses useFrame for per-frame animation. They DON'T check 
 * for frog proximity themselves — that would mean N distance checks × M 
 * objects every frame. Instead, the Frog component does proximity checks 
 * against a flat list of positions. This is an optimization called 
 * "centralizing collision detection."
 */

// =============================================
// GLOWING MUSHROOM — Eaten by frog's tongue (F key)
// =============================================
/**
 * The mushroom now has a visibility state passed from the parent.
 * When eaten, the mushroom fades out over ~0.3s (scale shrinks + opacity drops)
 * and the geometry stops rendering. When it respawns, it fades back in.
 * 
 * STATE SOURCE OF TRUTH: GameScene owns a `Set` of eaten indices.
 * Parent-child data flow: Set → InteractiveObjects → individual Mushroom.
 * 
 * Why a Set instead of an array of booleans? Set.has() is O(1) lookup,
 * and adding/removing items is also O(1). For a small number of mushrooms
 * (~7) it doesn't matter much, but it's a habit worth having.
 */
export function GlowingMushroom({ position, color, glowColor, isEaten }) {
  const capRef = useRef()
  const lightRef = useRef()
  const groupRef = useRef()
  const visibilityRef = useRef(1) // 1 = fully visible, 0 = fully hidden

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    
    // Fade in/out based on eaten state
    const targetVisibility = isEaten ? 0 : 1
    visibilityRef.current = THREE.MathUtils.lerp(
      visibilityRef.current, 
      targetVisibility, 
      0.12  // ~0.3 second fade
    )

    // Apply visibility as scale (more dramatic than opacity alone)
    if (groupRef.current) {
      const v = visibilityRef.current
      groupRef.current.scale.setScalar(Math.max(0.001, v))
      groupRef.current.visible = v > 0.01
    }

    // Pulse glow only when visible
    if (capRef.current && visibilityRef.current > 0.5) {
      capRef.current.material.emissiveIntensity = 0.6 + Math.sin(time * 2 + position[0]) * 0.4
    }
    if (lightRef.current) {
      lightRef.current.intensity = (1.5 + Math.sin(time * 2 + position[0]) * 0.5) * visibilityRef.current
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Stem */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#d4c8a0" roughness={0.8} />
      </mesh>

      {/* Cap — the glowing part */}
      <mesh ref={capRef} position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Spots on cap */}
      {[[-0.08, 0.6, 0.1], [0.1, 0.62, -0.05], [-0.04, 0.63, -0.1]].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Glow light */}
      <pointLight ref={lightRef} position={[0, 0.6, 0]} color={glowColor} intensity={1.5} distance={4} />

      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

// =============================================
// TRAMPOLINE LILY PAD — Bounces the frog high
// =============================================
export function TrampolinePad({ position }) {
  const padRef = useRef()
  const [isCompressed, setIsCompressed] = useState(false)

  useFrame((state) => {
    if (padRef.current) {
      const time = state.clock.elapsedTime
      // Gentle bounce-ready animation
      const bounce = Math.sin(time * 3 + position[0]) * 0.03
      padRef.current.position.y = 0.1 + bounce
    }
  })

  return (
    <group position={position}>
      {/* Water surface beneath */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.8, 20]} />
        <meshStandardMaterial
          color="#0a3a4a"
          roughness={0.2}
          metalness={0.4}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* The bouncy lily pad — brighter and springier looking */}
      <mesh ref={padRef} position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.12, 20]} />
        <meshStandardMaterial
          color="#2aaa4a"
          emissive="#00ff66"
          emissiveIntensity={0.2}
          roughness={0.5}
        />
      </mesh>

      {/* Spring coil visual underneath */}
      <mesh position={[0, -0.05, 0]}>
        <torusGeometry args={[0.5, 0.04, 8, 20]} />
        <meshStandardMaterial
          color="#4adf7a"
          emissive="#4adf7a"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Arrow indicators (↑) showing this is a launcher */}
      <Float speed={3} floatIntensity={0.4} floatingRange={[0, 0.3]}>
        <Text
          position={[0, 1, 0]}
          fontSize={0.35}
          color="#4adf7a"
          anchorX="center"
        >
          ⬆ Bounce!
        </Text>
      </Float>

      <pointLight position={[0, 0.5, 0]} color="#4adf7a" intensity={1} distance={4} />
    </group>
  )
}

// =============================================
// REED CLUSTER — Reveals secrets when disturbed
// =============================================
export function ReedCluster({ position, secret }) {
  /**
   * Reeds/cattails that sway gently. When the frog gets close,
   * they part to reveal a hidden message or creature.
   * 
   * The "disturbed" state is tracked and the reveal animates in.
   * We use the frog's position passed via the game loop to check 
   * proximity, but the visual animation is self-contained here.
   */
  const [isRevealed, setIsRevealed] = useState(false)
  const groupRef = useRef()
  const secretRef = useRef()
  const revealProgress = useRef(0)

  // Number of reeds
  const reeds = useMemo(() => {
    const r = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const dist = 0.3 + Math.random() * 0.6
      r.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        height: 1.2 + Math.random() * 1.0,
        sway: Math.random() * 0.5,
        hasCattail: Math.random() > 0.5,
      })
    }
    return r
  }, [])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Sway animation for reeds
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child.isGroup || child.isMesh) {
          const sway = reeds[i % reeds.length]?.sway || 0
          child.rotation.x = Math.sin(time * 1.5 + sway * 10) * 0.05
          child.rotation.z = Math.cos(time * 1.2 + sway * 8) * 0.03
        }
      })
    }

    // Secret reveal animation
    if (isRevealed && secretRef.current) {
      revealProgress.current = Math.min(1, revealProgress.current + 0.02)
      secretRef.current.material.opacity = revealProgress.current * 0.9
      secretRef.current.position.y = 1.5 + revealProgress.current * 0.5
    }
  })

  return (
    <group position={position}>
      {/* Reeds */}
      <group ref={groupRef}>
        {reeds.map((reed, i) => (
          <group key={i} position={[reed.x, 0, reed.z]}>
            {/* Reed stalk */}
            <mesh position={[0, reed.height / 2, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.04, reed.height, 5]} />
              <meshStandardMaterial color="#2a5a1a" roughness={0.85} />
            </mesh>
            {/* Cattail top (if applicable) */}
            {reed.hasCattail && (
              <mesh position={[0, reed.height - 0.1, 0]} castShadow>
                <capsuleGeometry args={[0.06, 0.2, 4, 6]} />
                <meshStandardMaterial color="#4a2a0a" roughness={0.9} />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* Hidden secret — revealed on approach */}
      <Float speed={2} floatIntensity={0.3}>
        <Text
          ref={secretRef}
          position={[0, 1.5, 0]}
          fontSize={0.25}
          color="#aaff44"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          material-transparent={true}
          material-opacity={0}
        >
          {secret || '🐛 Secret found!'}
        </Text>
      </Float>

      {/* Tiny base vegetation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.8, 12]} />
        <meshStandardMaterial color="#0d2a0d" roughness={0.95} />
      </mesh>
    </group>
  )
}

// =============================================
// PUDDLE — Ripples and reveals creatures
// =============================================
export function Puddle({ position, creature = '🐛' }) {
  /**
   * A shallow puddle on the forest floor. When the frog hops near it,
   * a ripple effect plays and a creature appears briefly.
   * 
   * The ripple is a torus (ring) that expands outward and fades.
   * This is a classic "expanding ring" VFX technique — scale the ring 
   * up while reducing opacity. Simple but very effective.
   */
  const rippleRef = useRef()
  const [showCreature, setShowCreature] = useState(false)
  const rippleScale = useRef(0)
  const isRippling = useRef(false)

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    // Ambient surface shimmer
    if (rippleRef.current && !isRippling.current) {
      rippleRef.current.material.opacity = 0.15 + Math.sin(time * 2) * 0.05
    }

    // Ripple expansion animation
    if (isRippling.current && rippleRef.current) {
      rippleScale.current += delta * 2
      if (rippleScale.current > 1) {
        isRippling.current = false
        rippleScale.current = 0
        rippleRef.current.scale.setScalar(1)
      } else {
        const s = 1 + rippleScale.current * 2
        rippleRef.current.scale.setScalar(s)
        rippleRef.current.material.opacity = 0.4 * (1 - rippleScale.current)
      }
    }
  })

  return (
    <group position={position}>
      {/* Puddle surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[1.2, 20]} />
        <meshStandardMaterial
          color="#1a5a6a"
          roughness={0.15}
          metalness={0.6}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Ripple ring */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.6, 0.7, 24]} />
        <meshBasicMaterial color="#4ac8ff" transparent opacity={0.15} />
      </mesh>

      {/* Mud border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.1, 1.5, 16]} />
        <meshStandardMaterial color="#1a2a10" roughness={0.95} />
      </mesh>

      {/* Creature (always visible as subtle shadow, brighter when activated) */}
      <Float speed={4} floatIntensity={0.1}>
        <Text
          position={[0.3, 0.08, 0.2]}
          fontSize={0.3}
          rotation={[-Math.PI / 2, 0, 0]}
          anchorX="center"
          material-transparent={true}
          material-opacity={0.4}
        >
          {creature}
        </Text>
      </Float>

      {/* Secondary creature */}
      <Float speed={3} floatIntensity={0.15}>
        <Text
          position={[-0.4, 0.08, -0.3]}
          fontSize={0.2}
          rotation={[-Math.PI / 2, 0, 0.2]}
          anchorX="center"
          material-transparent={true}
          material-opacity={0.3}
        >
          {creature === '🐛' ? '🦟' : '🐸'}
        </Text>
      </Float>
    </group>
  )
}

// =============================================
// MOSSY LOG BRIDGE — River crossing
// =============================================
export function MossyLogBridge({ position, rotation = 0, length = 5 }) {
  /**
   * A fallen log covered in moss, spanning the river.
   * Purely visual and navigational — the frog walks across it 
   * to cross the water. The moss adds environmental storytelling:
   * this log has been here long enough for life to grow on it.
   */
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main log */}
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, length, 10]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.95} />
      </mesh>

      {/* Bark texture rings */}
      {Array.from({ length: Math.floor(length / 0.8) }).map((_, i) => (
        <mesh
          key={`bark-${i}`}
          position={[(i - length / 1.6) * 0.8, 0.25, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <torusGeometry args={[0.32, 0.02, 6, 12]} />
          <meshStandardMaterial color="#1a1008" roughness={1} />
        </mesh>
      ))}

      {/* Moss patches — green lumps on top */}
      {Array.from({ length: 6 }).map((_, i) => {
        const x = (i - 2.5) * (length / 6)
        const side = i % 2 === 0 ? 1 : -1
        return (
          <mesh key={`moss-${i}`} position={[x, 0.48, side * 0.1]} castShadow>
            <sphereGeometry args={[0.15 + Math.random() * 0.1, 8, 6]} />
            <meshStandardMaterial color="#1a6a2a" roughness={0.9} />
          </mesh>
        )
      })}

      {/* Small mushrooms growing on the log */}
      {[
        [length * 0.2, 0.5, 0.2],
        [-length * 0.15, 0.5, -0.15],
        [length * 0.35, 0.48, 0.1],
      ].map((p, i) => (
        <group key={`logshroom-${i}`} position={p}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.03, 0.1, 5]} />
            <meshStandardMaterial color="#d4c8a0" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <sphereGeometry args={[0.06, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#c4a040" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * InteractiveObjects — Orchestrator Component
 * 
 * Places all interactive objects in the world based on configuration 
 * data. This keeps the GameScene clean — it just renders this component 
 * and passes the config data. Separation of concerns at its finest.
 * 
 * `eatenMushrooms` is a Set of mushroom indices that are currently 
 * eaten (hidden). It's recreated by GameScene each time a mushroom 
 * is eaten or respawned, which causes this component to re-render 
 * just enough to show/hide the right mushrooms.
 */
export default function InteractiveObjects({ config, eatenMushrooms }) {
  return (
    <group>
      {/* Glowing Mushrooms */}
      {config.mushrooms.map((m, i) => (
        <GlowingMushroom
          key={`mush-${i}`}
          position={m.position}
          color={m.color}
          glowColor={m.glowColor}
          isEaten={eatenMushrooms?.has(i) || false}
        />
      ))}

      {/* Trampoline Lily Pads */}
      {config.trampolines.map((t, i) => (
        <TrampolinePad key={`tramp-${i}`} position={t.position} />
      ))}

      {/* Reed Clusters */}
      {config.reeds.map((r, i) => (
        <ReedCluster key={`reed-${i}`} position={r.position} secret={r.secret} />
      ))}

      {/* Puddles */}
      {config.puddles.map((p, i) => (
        <Puddle key={`puddle-${i}`} position={p.position} creature={p.creature} />
      ))}

      {/* Mossy Log Bridges */}
      {config.logs.map((l, i) => (
        <MossyLogBridge
          key={`log-${i}`}
          position={l.position}
          rotation={l.rotation}
          length={l.length}
        />
      ))}
    </group>
  )
}
