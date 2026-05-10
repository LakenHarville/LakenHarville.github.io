import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Bugs.jsx — Animated Insect Swarm
 * 
 * Spawns 12 bugs of varying types that wander the rainforest. Each bug 
 * has simple AI: wander toward a random nearby target, then pick a new 
 * one when arrived. When the frog gets close, they flee.
 * 
 * BUG TYPES:
 * - LADYBUG: red dome with black spots, walks on the ground
 * - BUTTERFLY: small body with flapping wings, flies low
 * - BEETLE: dark elongated body with antennae, walks on ground
 * 
 * AI STATE MACHINE:
 * Each bug is in one of three states:
 *   WANDER → walking/flying toward its current target
 *   ARRIVED → brief pause at destination (looks alive!)
 *   FLEE → running away from the frog at high speed
 * 
 * Transitions:
 *   WANDER → ARRIVED (when within 0.3 units of target)
 *   ARRIVED → WANDER (after pause timer expires)
 *   * → FLEE (when frog within DETECTION_RADIUS)
 *   FLEE → WANDER (when frog moves out of FLEE_RADIUS, or after timeout)
 * 
 * WHY THIS PATTERN?
 * Simple state machines make AI tractable. If you tried to write each 
 * bug's behavior as one big mess of conditions, it'd be unmaintainable. 
 * "Each state has its own update function" is how every game from Pac-Man 
 * to modern AAA titles structures NPC behavior.
 * 
 * PERFORMANCE NOTES:
 * All 12 bugs are updated in ONE useFrame. Each bug's data lives in a 
 * regular JavaScript object (not React state) so updates don't trigger 
 * re-renders. We use refs to grab the actual Three.js mesh objects and 
 * mutate their .position and .rotation directly. This is ~1000x faster 
 * than going through React for animation.
 */

// Pre-allocated temp vectors — reuse to avoid garbage collection
const _vDir = new THREE.Vector3()
const _vTemp = new THREE.Vector3()

// =============================================
// LADYBUG — Walks on ground, red dome, black spots
// =============================================
function Ladybug({ bugData, frogPosRef }) {
  const groupRef = useRef()
  const wingsRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    updateBugAI(bugData, frogPosRef, delta, state.clock.elapsedTime, 'ground')

    groupRef.current.position.x = bugData.x
    groupRef.current.position.z = bugData.z
    groupRef.current.position.y = 0.08
    groupRef.current.rotation.y = bugData.facing

    // Subtle waddle when walking
    if (bugData.state !== 'ARRIVED') {
      const waddle = Math.sin(state.clock.elapsedTime * 12) * 0.05
      groupRef.current.rotation.z = waddle
    }
  })

  return (
    <group ref={groupRef}>
      {/* Body — red dome */}
      <mesh castShadow>
        <sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cc1a1a" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Head — small black dome */}
      <mesh position={[0, 0.04, 0.1]} castShadow>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Black spots */}
      {[
        [0.05, 0.09, -0.02], [-0.05, 0.09, -0.02],
        [0.04, 0.07, 0.06], [-0.04, 0.07, 0.06],
        [0, 0.11, 0.0],
      ].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}
      {/* Body underside */}
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 12]} />
        <meshStandardMaterial color="#3a0a0a" />
      </mesh>
      {/* Tiny antennae */}
      <mesh position={[0.025, 0.07, 0.13]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.04, 4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[-0.025, 0.07, 0.13]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.04, 4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  )
}

// =============================================
// BUTTERFLY — Flies low, with flapping wings
// =============================================
function Butterfly({ bugData, frogPosRef }) {
  const groupRef = useRef()
  const leftWingRef = useRef()
  const rightWingRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    updateBugAI(bugData, frogPosRef, delta, state.clock.elapsedTime, 'flying')

    groupRef.current.position.x = bugData.x
    groupRef.current.position.z = bugData.z
    // Flying height with sine bob
    const baseHeight = bugData.state === 'FLEE' ? 1.4 : 0.9
    groupRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3 + bugData.id) * 0.1
    groupRef.current.rotation.y = bugData.facing

    // Wing flap — faster when fleeing
    const flapSpeed = bugData.state === 'FLEE' ? 25 : 14
    const flapAngle = Math.sin(state.clock.elapsedTime * flapSpeed + bugData.id) * 0.9 + 0.4
    if (leftWingRef.current && rightWingRef.current) {
      leftWingRef.current.rotation.y = flapAngle
      rightWingRef.current.rotation.y = -flapAngle
    }
  })

  // Color variation per butterfly
  const wingColor = useMemo(() => {
    const colors = ['#ff8844', '#aa44ff', '#44aaff', '#ffaa44', '#ff44aa']
    return colors[bugData.id % colors.length]
  }, [bugData.id])

  return (
    <group ref={groupRef}>
      {/* Body — thin elongated capsule */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.02, 0.12, 4, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Left wing pair */}
      <group ref={leftWingRef} position={[0, 0, 0]}>
        {/* Upper wing */}
        <mesh position={[-0.08, 0, 0.02]} rotation={[0, 0, 0.1]}>
          <planeGeometry args={[0.16, 0.14]} />
          <meshStandardMaterial
            color={wingColor}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
        {/* Lower wing */}
        <mesh position={[-0.06, 0, -0.05]} rotation={[0, 0, -0.2]}>
          <planeGeometry args={[0.1, 0.08]} />
          <meshStandardMaterial
            color={wingColor}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      </group>
      {/* Right wing pair (mirror) */}
      <group ref={rightWingRef} position={[0, 0, 0]}>
        <mesh position={[0.08, 0, 0.02]} rotation={[0, 0, -0.1]}>
          <planeGeometry args={[0.16, 0.14]} />
          <meshStandardMaterial
            color={wingColor}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0.06, 0, -0.05]} rotation={[0, 0, 0.2]}>
          <planeGeometry args={[0.1, 0.08]} />
          <meshStandardMaterial
            color={wingColor}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      </group>
    </group>
  )
}

// =============================================
// BEETLE — Walks on ground, dark elongated dome
// =============================================
function Beetle({ bugData, frogPosRef }) {
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    updateBugAI(bugData, frogPosRef, delta, state.clock.elapsedTime, 'ground')

    groupRef.current.position.x = bugData.x
    groupRef.current.position.z = bugData.z
    groupRef.current.position.y = 0.06
    groupRef.current.rotation.y = bugData.facing
  })

  return (
    <group ref={groupRef}>
      {/* Elongated body — scaled sphere */}
      <mesh scale={[0.7, 0.5, 1.3]} castShadow>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color="#1a3a0a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Wing-line ridge down center */}
      <mesh position={[0, 0.04, 0]} scale={[0.05, 1, 1.3]}>
        <boxGeometry args={[0.05, 0.005, 0.18]} />
        <meshStandardMaterial color="#050a02" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.02, 0.12]} castShadow>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color="#0a1a02" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Antennae */}
      <mesh position={[0.025, 0.05, 0.16]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.003, 0.07, 4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[-0.025, 0.05, 0.16]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.003, 0.07, 4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  )
}

// =============================================
// AI STATE MACHINE
// =============================================
/**
 * Updates one bug's AI state and position.
 * 
 * This function is called once per bug per frame. It:
 * 1. Calculates distance to frog
 * 2. Decides what state the bug should be in
 * 3. Moves the bug according to its current state
 * 4. Updates state timers
 * 
 * The bug's "facing" angle is calculated using Math.atan2(dx, dz),
 * which converts a direction vector into a rotation angle. This is 
 * the standard way to make a sprite/mesh face the way it's moving.
 */
function updateBugAI(bug, frogPosRef, delta, time, locomotion) {
  const fp = frogPosRef.current
  const dxFrog = bug.x - fp.x
  const dzFrog = bug.z - fp.z
  const distToFrog = Math.sqrt(dxFrog * dxFrog + dzFrog * dzFrog)

  // ---- Tunable constants ----
  const DETECTION_RADIUS = 3.0   // Frog within this distance triggers FLEE
  const FLEE_RADIUS = 5.0        // Stop fleeing once frog is this far away
  const WANDER_SPEED = locomotion === 'flying' ? 0.8 : 0.5
  const FLEE_SPEED = locomotion === 'flying' ? 3.5 : 2.5
  const ARRIVAL_THRESHOLD = 0.3
  const PAUSE_DURATION = 1.5     // How long bug rests at a destination

  // ---- State transitions ----
  if (distToFrog < DETECTION_RADIUS && bug.state !== 'FLEE') {
    bug.state = 'FLEE'
    bug.fleeUntil = time + 1.0
  }
  if (bug.state === 'FLEE' && distToFrog > FLEE_RADIUS && time > bug.fleeUntil) {
    bug.state = 'WANDER'
    pickWanderTarget(bug)
  }

  // ---- Per-state behavior ----
  if (bug.state === 'WANDER') {
    const dx = bug.targetX - bug.x
    const dz = bug.targetZ - bug.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    
    if (dist < ARRIVAL_THRESHOLD) {
      // Arrived — pause briefly, then pick a new target
      bug.state = 'ARRIVED'
      bug.arrivedUntil = time + PAUSE_DURATION + Math.random() * 1.5
    } else {
      // Walk/fly toward target
      bug.x += (dx / dist) * WANDER_SPEED * delta
      bug.z += (dz / dist) * WANDER_SPEED * delta
      bug.facing = Math.atan2(dx, dz)
    }
  } else if (bug.state === 'ARRIVED') {
    if (time > bug.arrivedUntil) {
      bug.state = 'WANDER'
      pickWanderTarget(bug)
    }
  } else if (bug.state === 'FLEE') {
    // Flee directly away from the frog
    if (distToFrog > 0.001) {
      const fleeX = dxFrog / distToFrog
      const fleeZ = dzFrog / distToFrog
      bug.x += fleeX * FLEE_SPEED * delta
      bug.z += fleeZ * FLEE_SPEED * delta
      bug.facing = Math.atan2(fleeX, fleeZ)
    }
  }

  // ---- Boundary clamping (keep bugs in play area) ----
  bug.x = Math.max(-22, Math.min(22, bug.x))
  bug.z = Math.max(-22, Math.min(22, bug.z))
}

/**
 * Pick a new wander target within ~3-5 units of the bug's current position.
 * Random walks like this are how nature simulations get organic movement.
 */
function pickWanderTarget(bug) {
  const angle = Math.random() * Math.PI * 2
  const dist = 2 + Math.random() * 3
  bug.targetX = bug.x + Math.cos(angle) * dist
  bug.targetZ = bug.z + Math.sin(angle) * dist
}

// =============================================
// MAIN COMPONENT — Spawns and renders all bugs
// =============================================
function Bugs({ frogPosRef }) {
  /**
   * Initial bug spawn data. Each bug is a plain JS object that gets 
   * mutated in place during the game loop. Using `useMemo` ensures 
   * we only generate this list ONCE — not on every render.
   * 
   * Mix of types for visual variety:
   *   4 ladybugs, 5 butterflies, 3 beetles
   */
  const bugs = useMemo(() => {
    const types = [
      ...Array(4).fill('ladybug'),
      ...Array(5).fill('butterfly'),
      ...Array(3).fill('beetle'),
    ]
    return types.map((type, i) => {
      // Spawn in a ring around the play area, avoiding the center
      const angle = (i / types.length) * Math.PI * 2 + Math.random() * 0.5
      const dist = 8 + Math.random() * 12
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      return {
        id: i,
        type,
        x,
        z,
        targetX: x,
        targetZ: z,
        facing: Math.random() * Math.PI * 2,
        state: 'WANDER',
        arrivedUntil: 0,
        fleeUntil: 0,
      }
    })
  }, [])

  return (
    <group>
      {bugs.map((bug) => {
        if (bug.type === 'ladybug') {
          return <Ladybug key={bug.id} bugData={bug} frogPosRef={frogPosRef} />
        }
        if (bug.type === 'butterfly') {
          return <Butterfly key={bug.id} bugData={bug} frogPosRef={frogPosRef} />
        }
        return <Beetle key={bug.id} bugData={bug} frogPosRef={frogPosRef} />
      })}
    </group>
  )
}

export default Bugs
