import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { audioAPI } from '../../hooks/useAudioManager'

/**
 * Frog Component — Detailed Player Character (v2)
 *
 * KEY CHANGES FROM v1:
 *
 * 1. HOP-BASED MOVEMENT: Every WASD press triggers a small hop in that
 *    direction. Real frogs don't slide — they leap spot to spot. We use
 *    a state machine: IDLE → HOPPING → IDLE. During a hop, input is
 *    buffered. Think of a turn-based game at high speed.
 *
 * 2. DETAILED MODEL: Smooth spheres replace boxy limbs. Prominent eyes
 *    with orange irises and horizontal pupils (like real tree frogs).
 *    Webbed toes, back spots, and an inflatable throat pouch.
 *
 * 3. CROAK SYSTEM: Every 15 seconds the throat pouch inflates with a
 *    double-pulse. Hook up Howler.js later for the actual sound.
 *
 * 4. COLOR CHANGING: Glowing mushrooms set a target color, and the
 *    material lerps toward it each frame for a smooth transition.
 *
 * WHY useRef FOR GAME STATE?
 * useState triggers React re-renders. At 60fps that's 60 re-renders/second.
 * useRef mutates a value silently — like writing on a whiteboard vs.
 * sending a company-wide email every time you update a number.
 */

const _tempVec3 = new THREE.Vector3()

function Frog({ elements, interactiveObjects, eatenMushrooms, onElementActivate, onNearElement, onColorChange, onEatMushroom, frogPosRef, gameActive }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const throatRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()
  const tongueRef = useRef()
  const { camera } = useThree()

  // Movement
  const keys = useRef({})
  const position = useRef(new THREE.Vector3(0, 0, 5))
  const targetPosition = useRef(new THREE.Vector3(0, 0, 5))
  const startPosition = useRef(new THREE.Vector3(0, 0, 5))
  const rotation = useRef(0)
  const targetRotation = useRef(0)

  // Hop state machine
  const isHopping = useRef(false)
  const hopProgress = useRef(0)
  const hopType = useRef('move')
  const lastHopTime = useRef(0)

  // Croak
  const lastCroakTime = useRef(0)
  const isCroaking = useRef(false)
  const croakProgress = useRef(0)

  // Color
  const currentColor = useRef(new THREE.Color('#1a8a4a'))
  const targetColorRef = useRef(new THREE.Color('#1a8a4a'))
  const bellyColor = useRef(new THREE.Color('#7aef9a'))
  const targetBellyRef = useRef(new THREE.Color('#7aef9a'))

  // Body materials. R3F's inline `color={threeColor}` COPIES the value into
  // a fresh THREE.Color on the material, so mutating currentColor.current at
  // 60fps never reached the GPU. Pre-build the materials here and reassign
  // their `.color` to the shared refs so a single lerp recolors every part.
  const frogMaterials = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 })
    const dorsal = new THREE.MeshStandardMaterial({ roughness: 0.5 })
    const eyeSocket = new THREE.MeshStandardMaterial({ roughness: 0.5 })
    const leg = new THREE.MeshStandardMaterial({ roughness: 0.6 })
    const belly = new THREE.MeshStandardMaterial({ roughness: 0.65, transparent: true, opacity: 0.95 })
    body.color = currentColor.current
    dorsal.color = currentColor.current
    eyeSocket.color = currentColor.current
    leg.color = currentColor.current
    belly.color = bellyColor.current
    return { body, dorsal, eyeSocket, leg, belly }
  }, [])

  // Proximity
  const nearestElement = useRef(null)

  // Trampoline bounce
  const isBouncing = useRef(false)
  const bounceProgress = useRef(0)
  const bounceHeight = useRef(0)

  // ---- Tongue state machine ----
  // Three phases: IDLE → EXTENDING → RETRACTING → IDLE
  // We track the target mushroom locked in at "shoot" time so the tongue
  // doesn't bend mid-extension if another mushroom is closer.
  const isTonguing = useRef(false)
  const tonguePhase = useRef('idle') // 'extending' | 'retracting'
  const tongueProgress = useRef(0)
  const tongueTarget = useRef({ x: 0, z: 0, mushroomIdx: -1 })
  const lastTongueTime = useRef(0)

  // Camera — uses DOUBLE SMOOTHING to eliminate motion sickness.
  //
  // Instead of snapping the camera target on each hop landing,
  // we lerp smoothCameraTarget toward the frog's ground position
  // every single frame. Then the CAMERA lerps toward THAT target.
  //
  // Analogy: Imagine the frog is a race car. smoothCameraTarget is
  // a drone following the car with a rubber band. The actual camera
  // is a helicopter following the drone with an even longer rubber band.
  // The car can jerk and bounce, but by the time the motion reaches
  // the helicopter, it's buttery smooth.
  const smoothCameraTarget = useRef(new THREE.Vector3(0, 0, 5))
  const smoothLookTarget = useRef(new THREE.Vector3(0, 0, 5))

  // Constants — tune these to change game feel
  const HOP_DISTANCE = 1.2
  const HOP_HEIGHT_SMALL = 0.6
  const HOP_HEIGHT_BIG = 1.8
  const HOP_DURATION_SMALL = 0.25
  const HOP_DURATION_BIG = 0.45
  const BOUNCE_HEIGHT = 5.0
  const BOUNCE_DURATION = 0.8
  const BOUNDARY = 24
  const INTERACT_DISTANCE = 3.5
  const CROAK_INTERVAL = 15
  const CROAK_DURATION = 1.2

  // Tongue tunables
  const TONGUE_RANGE = 3.0          // Max distance the tongue can reach
  const TONGUE_DURATION = 0.3       // Total animation time (extend + retract)
  const TONGUE_COOLDOWN = 0.4       // Min time between tongue uses

  // Keyboard
  const handleKeyDown = (e) => {
    if (e.code === 'Space') e.preventDefault()
    keys.current[e.code] = true
  }
  const handleKeyUp = (e) => { keys.current[e.code] = false }

  // Attach listeners once
  const listenersAttached = useRef(false)
  if (!listenersAttached.current) {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    listenersAttached.current = true
  }

  const initiateHop = (dirX, dirZ, type = 'move') => {
    const pos = position.current
    const dist = type === 'move' ? HOP_DISTANCE : HOP_DISTANCE * 1.5
    startPosition.current.copy(pos)
    targetPosition.current.set(
      THREE.MathUtils.clamp(pos.x + dirX * dist, -BOUNDARY, BOUNDARY),
      0,
      THREE.MathUtils.clamp(pos.z + dirZ * dist, -BOUNDARY, BOUNDARY)
    )
    if (dirX !== 0 || dirZ !== 0) {
      targetRotation.current = Math.atan2(dirX, dirZ)
    }
    isHopping.current = true
    hopProgress.current = 0
    hopType.current = type
  }

  // ===== GAME LOOP =====
  useFrame((state, delta) => {
    if (!groupRef.current || !gameActive) return
    const time = state.clock.elapsedTime
    const k = keys.current
    const pos = position.current

    // ---- Croak every 15s ----
    if (time - lastCroakTime.current >= CROAK_INTERVAL && !isCroaking.current) {
      isCroaking.current = true
      croakProgress.current = 0
      lastCroakTime.current = time
      audioAPI.playSFX('croak')
    }
    if (isCroaking.current) {
      croakProgress.current += delta / CROAK_DURATION
      if (croakProgress.current >= 1) {
        isCroaking.current = false
        croakProgress.current = 0
      }
    }

    // ---- Trampoline bounce ----
    if (isBouncing.current) {
      bounceProgress.current += delta / BOUNCE_DURATION
      if (bounceProgress.current >= 1) {
        isBouncing.current = false
        bounceProgress.current = 0
      }
      const bounceY = Math.sin(Math.PI * bounceProgress.current) * bounceHeight.current
      groupRef.current.position.set(pos.x, bounceY, pos.z)
      // During bounce: camera barely reacts. It stays at its current
      // position and only gently adjusts its gaze upward. The player
      // sees the frog fly up while the "camera operator" stays grounded.
      smoothCameraTarget.current.lerp(_tempVec3.set(pos.x, 0, pos.z), 0.01)
      const ct = smoothCameraTarget.current
      camera.position.lerp(_tempVec3.set(ct.x * 0.6, 14, ct.z + 18), 0.01)
      camera.lookAt(ct.x * 0.4, 0, ct.z)
      return
    }

    // ---- Hop movement ----
    if (isHopping.current) {
      const duration = hopType.current === 'move' ? HOP_DURATION_SMALL : HOP_DURATION_BIG
      const height = hopType.current === 'move' ? HOP_HEIGHT_SMALL : HOP_HEIGHT_BIG
      hopProgress.current += delta / duration

      if (hopProgress.current >= 1) {
        hopProgress.current = 1
        isHopping.current = false
        pos.copy(targetPosition.current)
        groupRef.current.position.set(pos.x, 0, pos.z)
      } else {
        const t = hopProgress.current
        const hopY = Math.sin(Math.PI * t) * height
        const cx = THREE.MathUtils.lerp(startPosition.current.x, targetPosition.current.x, t)
        const cz = THREE.MathUtils.lerp(startPosition.current.z, targetPosition.current.z, t)
        groupRef.current.position.set(cx, hopY, cz)
      }
    } else {
      // Idle — check input
      let dirX = 0, dirZ = 0
      if (k['KeyW'] || k['ArrowUp']) dirZ = -1
      if (k['KeyS'] || k['ArrowDown']) dirZ = 1
      if (k['KeyA'] || k['ArrowLeft']) dirX = -1
      if (k['KeyD'] || k['ArrowRight']) dirX = 1
      if (dirX !== 0 && dirZ !== 0) { dirX *= 0.707; dirZ *= 0.707 }

      if (k['Space'] && time - lastHopTime.current > 0.3) {
        lastHopTime.current = time
        if (nearestElement.current) {
          onElementActivate(nearestElement.current)
          return
        }
        // Check trampoline pads
        if (interactiveObjects?.trampolines) {
          for (const pad of interactiveObjects.trampolines) {
            const dx = pos.x - pad.position[0]
            const dz = pos.z - pad.position[2]
            if (Math.sqrt(dx * dx + dz * dz) < 2.0) {
              isBouncing.current = true
              bounceProgress.current = 0
              bounceHeight.current = BOUNCE_HEIGHT
              return
            }
          }
        }
        initiateHop(dirX || 0, dirZ || -1, 'jump')
      } else if ((dirX !== 0 || dirZ !== 0) && time - lastHopTime.current > 0.18) {
        lastHopTime.current = time
        initiateHop(dirX, dirZ, 'move')
      }
      groupRef.current.position.set(pos.x, 0, pos.z)
    }

    // ---- Smooth rotation ----
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, targetRotation.current, 0.2
    )

    // ---- Squash & stretch ----
    if (bodyRef.current) {
      if (isHopping.current) {
        const phase = Math.sin(Math.PI * hopProgress.current)
        bodyRef.current.scale.set(1 - phase * 0.15, 1 + phase * 0.35, 1 - phase * 0.15)
      } else {
        const breathe = Math.sin(time * 2) * 0.03
        bodyRef.current.scale.set(1, 1 + breathe, 1)
      }
    }

    // ---- Throat croak ----
    if (throatRef.current) {
      if (isCroaking.current) {
        const t = croakProgress.current
        const pulse = Math.sin(Math.PI * t * 3) * Math.sin(Math.PI * t)
        throatRef.current.scale.setScalar(1 + Math.max(0, pulse) * 1.8)
      } else {
        throatRef.current.scale.setScalar(1)
      }
    }

    // ---- Eye blink ----
    const isBlinking = (time % 4) > 3.85
    if (leftEyeRef.current && rightEyeRef.current) {
      const target = isBlinking ? 0.1 : 1
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, target, 0.3)
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, target, 0.3)
    }

    // ---- Tongue mesh animation ----
    // The tongue is a cylinder positioned at the mouth and rotated to point
    // at its target. Its length scales smoothly during extend/retract.
    //
    // Visual trick: the tongue's parent group must move forward by half the
    // tongue's length so the BACK end stays planted at the mouth while the
    // FRONT end reaches toward the target. Without this offset, the tongue
    // would scale outward in both directions like a magic wand.
    if (tongueRef.current) {
      if (isTonguing.current) {
        // World-space distance from frog to target
        const tdx = tongueTarget.current.x - pos.x
        const tdz = tongueTarget.current.z - pos.z
        const targetDist = Math.min(TONGUE_RANGE, Math.sqrt(tdx * tdx + tdz * tdz))

        // Smooth ease-in-out — sin gives natural acceleration/deceleration
        const t = tonguePhase.current === 'extending'
          ? tongueProgress.current
          : 1 - tongueProgress.current
        const eased = Math.sin(t * Math.PI / 2)
        const currentLength = targetDist * eased

        // Tongue always shoots straight forward out of the mouth.
        // The frog snap-rotates to face its target when F is pressed (see
        // F-key handler below), so "forward" is also "toward the target".
        tongueRef.current.visible = true
        tongueRef.current.rotation.y = 0
        tongueRef.current.scale.z = Math.max(0.001, currentLength * 5)
        const halfLen = currentLength / 2
        tongueRef.current.position.x = 0
        tongueRef.current.position.y = 0.35
        tongueRef.current.position.z = 0.5 + halfLen
      } else {
        tongueRef.current.visible = false
      }
    }

    // ---- Color lerp ----
    currentColor.current.lerp(targetColorRef.current, 0.05)
    bellyColor.current.lerp(targetBellyRef.current, 0.05)

    // ---- Proximity to portals ----
    let nearest = null, nearestDist = INTERACT_DISTANCE
    for (const el of elements) {
      const dx = pos.x - el.position[0]
      const dz = pos.z - el.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < nearestDist) { nearestDist = dist; nearest = el.name }
    }
    if (nearest !== nearestElement.current) {
      nearestElement.current = nearest
      onNearElement(nearest)
    }

    // ---- Write frog position for bugs to read (no re-render needed) ----
    if (frogPosRef) {
      frogPosRef.current.x = pos.x
      frogPosRef.current.z = pos.z
    }

    // ---- TONGUE MECHANIC (F key) ----
    // Process F key only when idle (not already mid-tongue)
    if (k['KeyF'] && !isTonguing.current && time - lastTongueTime.current > TONGUE_COOLDOWN) {
      lastTongueTime.current = time

      // Find the nearest UN-EATEN mushroom within tongue range
      let bestIdx = -1
      let bestDist = TONGUE_RANGE
      let bestMushroom = null
      if (interactiveObjects?.mushrooms) {
        for (let i = 0; i < interactiveObjects.mushrooms.length; i++) {
          // Skip mushrooms that are currently eaten/respawning
          if (eatenMushrooms?.has(i)) continue
          const m = interactiveObjects.mushrooms[i]
          const dx = m.position[0] - pos.x
          const dz = m.position[2] - pos.z
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist < bestDist) {
            bestDist = dist
            bestIdx = i
            bestMushroom = m
          }
        }
      }

      // Lock in the tongue's destination at "shoot" time
      if (bestMushroom) {
        // Snap the frog to face the mushroom so the tongue always shoots
        // straight out of the mouth, regardless of which way the frog was facing.
        const aimDx = bestMushroom.position[0] - pos.x
        const aimDz = bestMushroom.position[2] - pos.z
        const aimAngle = Math.atan2(aimDx, aimDz)
        groupRef.current.rotation.y = aimAngle
        targetRotation.current = aimAngle

        tongueTarget.current.x = bestMushroom.position[0]
        tongueTarget.current.z = bestMushroom.position[2]
        tongueTarget.current.mushroomIdx = bestIdx
        // Eat it! Frog turns the mushroom's color (body + belly).
        targetColorRef.current.set(bestMushroom.color)
        targetBellyRef.current.set(bestMushroom.color)
        if (onColorChange) onColorChange(bestMushroom.color)
        if (onEatMushroom) onEatMushroom(bestIdx)
        audioAPI.playSFX('munch')
      } else {
        // No target — tongue extends straight forward at half-range, just for show
        const forwardX = pos.x + Math.sin(targetRotation.current) * (TONGUE_RANGE * 0.5)
        const forwardZ = pos.z + Math.cos(targetRotation.current) * (TONGUE_RANGE * 0.5)
        tongueTarget.current.x = forwardX
        tongueTarget.current.z = forwardZ
        tongueTarget.current.mushroomIdx = -1
      }

      isTonguing.current = true
      tonguePhase.current = 'extending'
      tongueProgress.current = 0
    }

    // Animate tongue
    if (isTonguing.current) {
      tongueProgress.current += delta / (TONGUE_DURATION / 2)
      if (tongueProgress.current >= 1) {
        tongueProgress.current = 0
        if (tonguePhase.current === 'extending') {
          tonguePhase.current = 'retracting'
        } else {
          isTonguing.current = false
          tonguePhase.current = 'idle'
        }
      }
    }

    // ---- Camera follow (DOUBLE SMOOTHING) ----
    //
    // STEP 1: smoothCameraTarget lerps toward the frog's GROUND position
    // (X/Z only, Y is always 0) every frame. The 0.04 factor means it
    // follows at 4% per frame — lagging behind like a drone on a rubber band.
    // Even if the frog hops rapidly, this target moves in a gentle arc.
    //
    // STEP 2: The actual camera lerps toward a position DERIVED from
    // smoothCameraTarget. Another 0.02 lerp on top. Two layers of
    // smoothing = extremely stable.
    //
    // STEP 3: lookAt target is also double-smoothed. camera.lookAt()
    // is instantaneous, but because the POINT it looks at moves smoothly,
    // the camera pivots gently instead of snapping.
    //
    // The Y component is ALWAYS fixed (14 for height). The camera never
    // reacts to the frog's hop arc or bounce height. This is the #1
    // thing that prevents motion sickness.
    if (!isBouncing.current) {
      // Step 1: Smooth the target toward frog's ground position
      smoothCameraTarget.current.lerp(_tempVec3.set(pos.x, 0, pos.z), 0.04)
      smoothLookTarget.current.lerp(_tempVec3.set(pos.x, 0, pos.z), 0.04)

      // Step 2: Camera position lerps toward the smoothed target
      const ct = smoothCameraTarget.current
      const desiredCamPos = _tempVec3.set(ct.x * 0.6, 14, ct.z + 18)
      camera.position.lerp(desiredCamPos, 0.02)

      // Step 3: Look at the smoothed look target (on the ground plane)
      const lt = smoothLookTarget.current
      camera.lookAt(lt.x * 0.4, 0, lt.z)
    }
  })

  // Spot positions on back
  const spots = useMemo(() => [
    { pos: [0, 0.62, -0.15], size: 0.08 },
    { pos: [0.15, 0.58, -0.1], size: 0.06 },
    { pos: [-0.12, 0.6, -0.2], size: 0.07 },
    { pos: [0.08, 0.55, -0.25], size: 0.05 },
    { pos: [-0.18, 0.55, -0.05], size: 0.06 },
    { pos: [0.2, 0.52, -0.18], size: 0.05 },
  ], [])

  return (
    <group ref={groupRef} position={[0, 0, 5]}>
      <group ref={bodyRef}>
        {/* Main body */}
        <mesh position={[0, 0.38, 0]} castShadow material={frogMaterials.body}>
          <sphereGeometry args={[0.52, 24, 18]} />
        </mesh>

        {/* Dorsal ridge */}
        <mesh position={[0, 0.55, -0.12]} castShadow material={frogMaterials.dorsal}>
          <sphereGeometry args={[0.38, 20, 14]} />
        </mesh>

        {/* Back spots */}
        {spots.map((s, i) => (
          <mesh key={`spot-${i}`} position={s.pos}>
            <sphereGeometry args={[s.size, 10, 8]} />
            <meshStandardMaterial color="#0d5a2a" roughness={0.7} />
          </mesh>
        ))}

        {/* Belly */}
        <mesh position={[0, 0.25, 0.12]} castShadow material={frogMaterials.belly}>
          <sphereGeometry args={[0.42, 20, 14]} />
        </mesh>

        {/* Throat pouch (croak animation) */}
        <mesh ref={throatRef} position={[0, 0.2, 0.3]} castShadow>
          <sphereGeometry args={[0.18, 14, 10]} />
          <meshStandardMaterial color="#8befa0" roughness={0.6} transparent opacity={0.85} />
        </mesh>

        {/* ===== LEFT EYE ===== */}
        <group position={[-0.24, 0.72, 0.18]}>
          <mesh castShadow material={frogMaterials.eyeSocket}>
            <sphereGeometry args={[0.2, 16, 12]} />
          </mesh>
          <group ref={leftEyeRef}>
            <mesh position={[0, 0.04, 0.1]}>
              <sphereGeometry args={[0.15, 14, 10]} />
              <meshStandardMaterial color="#f0f0e0" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0.19]}>
              <sphereGeometry args={[0.1, 12, 8]} />
              <meshStandardMaterial color="#c44d00" roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.04, 0.22]}>
              <sphereGeometry args={[0.06, 10, 8]} />
              <meshStandardMaterial color="#0a0a0a" />
            </mesh>
            <mesh position={[-0.03, 0.07, 0.23]}>
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
          </group>
        </group>

        {/* ===== RIGHT EYE ===== */}
        <group position={[0.24, 0.72, 0.18]}>
          <mesh castShadow material={frogMaterials.eyeSocket}>
            <sphereGeometry args={[0.2, 16, 12]} />
          </mesh>
          <group ref={rightEyeRef}>
            <mesh position={[0, 0.04, 0.1]}>
              <sphereGeometry args={[0.15, 14, 10]} />
              <meshStandardMaterial color="#f0f0e0" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0.19]}>
              <sphereGeometry args={[0.1, 12, 8]} />
              <meshStandardMaterial color="#c44d00" roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.04, 0.22]}>
              <sphereGeometry args={[0.06, 10, 8]} />
              <meshStandardMaterial color="#0a0a0a" />
            </mesh>
            <mesh position={[0.03, 0.07, 0.23]}>
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
          </group>
        </group>

        {/* Nostrils */}
        <mesh position={[-0.08, 0.52, 0.42]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#0a4a2a" />
        </mesh>
        <mesh position={[0.08, 0.52, 0.42]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#0a4a2a" />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, 0.35, 0.5]}>
          <boxGeometry args={[0.35, 0.015, 0.015]} />
          <meshStandardMaterial color="#0a5a2a" />
        </mesh>

        {/* ===== TONGUE =====
            Architecture: a parent <group> handles aiming (rotation.y) and
            length scaling (scale.z). Inside, a cylinder rotated 90° around X
            lays along the Z axis with its base AT the origin (we shift it
            forward by half its native length). Then when the parent group
            scales on Z, the tongue elongates from the mouth outward.

            Base geometry length = 0.2 (along Z after rotation).
            scale.z = currentLength / 0.2 stretches it to the target distance.
            position.x/z on the parent group offsets the visual midpoint forward.
        */}
        <group ref={tongueRef} position={[0, 0.35, 0.5]} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.2, 8]} />
            <meshStandardMaterial
              color="#ff6b8a"
              roughness={0.6}
              metalness={0.05}
              emissive="#ff3355"
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>

        {/* ===== FRONT LEGS with webbed toes ===== */}
        {[[-1, -0.5], [1, 0.5]].map(([side, rotZ], li) => (
          <group key={`fleg-${li}`} position={[0.38 * side, 0.15, 0.2]} rotation={[0.4, 0, rotZ]}>
            <mesh castShadow material={frogMaterials.leg}>
              <capsuleGeometry args={[0.06, 0.2, 6, 10]} />
            </mesh>
            <group position={[0, -0.18, 0.05]}>
              <mesh castShadow material={frogMaterials.leg}>
                <sphereGeometry args={[0.07, 10, 8]} />
              </mesh>
              {[-0.06, 0, 0.06].map((tx, i) => (
                <mesh key={i} position={[tx, -0.02, 0.06]} rotation={[0.3, 0, (i - 1) * 0.3]} castShadow>
                  <capsuleGeometry args={[0.02, 0.08, 4, 6]} />
                  <meshStandardMaterial color="#138a44" roughness={0.7} />
                </mesh>
              ))}
            </group>
          </group>
        ))}

        {/* ===== BACK LEGS (larger, folded Z-shape) ===== */}
        {[-1, 1].map((side, li) => (
          <group key={`bleg-${li}`} position={[0.35 * side, 0.18, -0.2]}>
            <mesh position={[0.12 * side, 0, 0]} rotation={[0, 0, -0.8 * side]} castShadow material={frogMaterials.leg}>
              <capsuleGeometry args={[0.09, 0.25, 6, 10]} />
            </mesh>
            <mesh position={[0.28 * side, -0.08, 0.05]} rotation={[0.3, 0, 0.6 * side]} castShadow material={frogMaterials.leg}>
              <capsuleGeometry args={[0.065, 0.22, 6, 10]} />
            </mesh>
            <group position={[0.32 * side, -0.1, 0.15]}>
              <mesh castShadow material={frogMaterials.leg}>
                <sphereGeometry args={[0.08, 10, 8]} />
              </mesh>
              {[-0.07, -0.02, 0.04, 0.09].map((tx, i) => (
                <mesh key={i} position={[tx * side, -0.02, 0.06]} rotation={[0.3, 0, (i - 1.5) * 0.2 * side]} castShadow>
                  <capsuleGeometry args={[0.02, 0.1, 4, 6]} />
                  <meshStandardMaterial color="#138a44" roughness={0.7} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>

      {/* Shadow disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      <pointLight position={[0, 0.5, 0]} color="#00e87b" intensity={0.4} distance={3} />
    </group>
  )
}

export default Frog
