import { useMemo, useState, useRef, useCallback } from 'react'
import { Sky } from '@react-three/drei'
import Frog from './Frog'
import GameElement from './GameElement'
import RainforestEnvironment from './RainforestEnvironment'
import InteractiveObjects from './InteractiveObjects'
import Bugs from './Bugs'

/**
 * GameScene — The World Orchestrator
 * 
 * This component is the "director" of the 3D world. It doesn't 
 * render much itself — instead it:
 * 
 * 1. Defines the LIGHTING (the "mood")
 * 2. Places the PORTAL ELEMENTS (the objectives)
 * 3. Configures all INTERACTIVE OBJECTS (the toys)
 * 4. Renders the ENVIRONMENT (the set)
 * 5. Spawns the FROG (the actor)
 * 
 * DATA-DRIVEN LEVEL DESIGN:
 * All object placements are defined as data (arrays/objects), not 
 * hardcoded JSX. Want to move a mushroom? Change a coordinate.
 * Want to add a new puddle? Add an object to the array.
 * This is the same principle behind game engines like Unity — 
 * the scene is defined by data, not code structure.
 * 
 * The `useMemo` on the config objects is crucial: it caches these 
 * arrays so they aren't recreated every render. Without it, the 
 * Frog component would see "new" objects every frame and waste 
 * cycles rechecking identical data.
 */
function GameScene({ onElementActivate, onNearElement, onColorChange, gameActive }) {

  // ======== MUSHROOM EATEN STATE ========
  // A Set of mushroom indices currently eaten (hidden). When the frog 
  // eats a mushroom, we add its index here, then schedule a respawn 
  // after MUSHROOM_RESPAWN_TIME via setTimeout.
  const [eatenMushrooms, setEatenMushrooms] = useState(new Set())
  const MUSHROOM_RESPAWN_TIME = 6000  // 6 seconds

  // ======== FROG POSITION REF ========
  // Bugs need to know where the frog is to flee. Using state would 
  // trigger 60 re-renders/sec — terrible. Instead, the Frog writes its 
  // X/Z to this ref each frame, and Bugs read from it. Refs persist 
  // across renders without causing re-renders.
  const frogPosRef = useRef({ x: 0, z: 0 })

  /**
   * Handle frog eating a mushroom.
   * 
   * Why a NEW Set instead of mutating the existing one?
   * React only re-renders when state REFERENCES change. If we did 
   * `eatenMushrooms.add(idx); setEatenMushrooms(eatenMushrooms)`, React 
   * would compare the same reference to itself and skip the re-render.
   * Creating a new Set with `new Set(prev).add(idx)` guarantees a new 
   * reference, so React knows to re-render.
   */
  const handleEatMushroom = useCallback((mushroomIdx) => {
    setEatenMushrooms(prev => {
      const next = new Set(prev)
      next.add(mushroomIdx)
      return next
    })
    // Respawn after delay
    setTimeout(() => {
      setEatenMushrooms(prev => {
        const next = new Set(prev)
        next.delete(mushroomIdx)
        return next
      })
    }, MUSHROOM_RESPAWN_TIME)
  }, [])

  // ======== PORTAL ELEMENTS (Lily Pads) ========
  // Scattered through the rainforest at key clearings
  const elements = useMemo(() => [
    {
      name: 'Resume',
      position: [10, 0, -10],
      color: '#00e87b',
    },
    {
      name: 'Education',
      position: [-12, 0, -8],
      color: '#4d7aff',
    },
    {
      name: 'Projects',
      position: [-6, 0, -18],
      color: '#a855f7',
    },
    {
      name: 'Interests',
      position: [14, 0, 12],
      color: '#f59e0b',
    },
  ], [])

  // ======== INTERACTIVE OBJECTS CONFIG ========
  const interactiveConfig = useMemo(() => ({
    /**
     * GLOWING MUSHROOMS
     * Each has a position, cap color, glow color, and the color it 
     * imparts to the frog on contact. Scattered in shaded areas 
     * under trees and near the river.
     */
    mushrooms: [
      {
        position: [-4, 0, 2],
        color: '#ff4488',
        glowColor: '#ff4488',
        frogColor: '#aa2266',
        frogBellyColor: '#ff88aa',
      },
      {
        position: [7, 0, 5],
        color: '#4488ff',
        glowColor: '#4488ff',
        frogColor: '#2244aa',
        frogBellyColor: '#88aaff',
      },
      {
        position: [-8, 0, -4],
        color: '#ffaa00',
        glowColor: '#ffaa00',
        frogColor: '#aa7700',
        frogBellyColor: '#ffcc66',
      },
      {
        position: [3, 0, -6],
        color: '#aa44ff',
        glowColor: '#aa44ff',
        frogColor: '#7722cc',
        frogBellyColor: '#cc88ff',
      },
      {
        position: [12, 0, -3],
        color: '#00ffcc',
        glowColor: '#00ffcc',
        frogColor: '#008866',
        frogBellyColor: '#66ffdd',
      },
      {
        position: [-14, 0, 10],
        color: '#ff6644',
        glowColor: '#ff6644',
        frogColor: '#cc4422',
        frogBellyColor: '#ff9977',
      },
      // The "reset" mushroom — turns the frog back to default green
      {
        position: [0, 0, 10],
        color: '#00e87b',
        glowColor: '#00e87b',
        frogColor: '#1a8a4a',
        frogBellyColor: '#7aef9a',
      },
    ],

    /**
     * TRAMPOLINE LILY PADS
     * Placed near interesting vantage points — bounce up to see 
     * the whole forest from above!
     */
    trampolines: [
      { position: [5, 0, 0] },
      { position: [-5, 0, -12] },
      { position: [15, 0, -6] },
      { position: [-10, 0, 14] },
    ],

    /**
     * REED CLUSTERS with hidden secrets
     * Each has a secret message or fun fact revealed on approach.
     */
    reeds: [
      { position: [-3, 0, -3], secret: '🦎 A gecko watches silently...' },
      { position: [8, 0, -8], secret: '✨ You found a golden beetle!' },
      { position: [-10, 0, 6], secret: '🍄 Fungi network detected!' },
      { position: [6, 0, 14], secret: '🐍 A friendly snake says hi!' },
      { position: [-7, 0, -16], secret: '🌺 Rare orchid discovered!' },
      { position: [16, 0, 6], secret: '🦋 A morpho butterfly!' },
      { position: [-15, 0, -10], secret: '🪲 Stag beetle territory!' },
      { position: [2, 0, -13], secret: '🌿 Ancient fern spores!' },
    ],

    /**
     * PUDDLES with creatures
     * Shallow water pools that show tadpoles and insects.
     */
    puddles: [
      { position: [2, 0, 3], creature: '🐛' },
      { position: [-6, 0, -8], creature: '🦟' },
      { position: [10, 0, 8], creature: '🐛' },
      { position: [-12, 0, 2], creature: '🐸' }, // Tadpoles!
      { position: [4, 0, -15], creature: '🦟' },
      { position: [-2, 0, 16], creature: '🐛' },
      { position: [14, 0, -14], creature: '🐸' },
    ],

    /**
     * MOSSY LOG BRIDGES
     * Spanning the river at key crossing points.
     * The river winds from top-left to bottom-right,
     * so logs are angled perpendicular to the flow.
     */
    logs: [
      { position: [-10, 0, -8], rotation: 0.5, length: 5 },
      { position: [-2, 0, 2], rotation: -0.1, length: 4.5 },
      { position: [6, 0, 10], rotation: -0.3, length: 5 },
      { position: [13, 0, 15], rotation: -0.2, length: 4 },
    ],
  }), [])

  return (
    <>
      {/* ======== LIGHTING — DAYTIME RAINFOREST ========
          
          Think of a real rainforest at midday: bright sun overhead 
          filtering through the canopy, creating dappled light patches.
          The key is HIGH ambient (lots of scattered light bouncing 
          around) plus a strong directional "sun" for shadows and depth.
          
          The hemisphere light is the secret weapon here — it simulates 
          light bouncing off the sky (blue-ish from above) and ground 
          (green-ish from below, reflecting the foliage). In a real 
          forest, you're basically inside a green-tinted light box.
      */}
      
      {/* Ambient — bright and warm. Higher intensity than night to 
          simulate all that scattered/bounced daylight in a forest. */}
      <ambientLight intensity={0.6} color="#fffbe6" />

      {/* Sun — strong, warm, overhead. The main shadow caster.
          Position high and slightly angled for long, dramatic shadows. */}
      <directionalLight
        position={[10, 25, 10]}
        intensity={1.8}
        color="#fff8e7"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      {/* Fill light from opposite side — prevents pitch-black shadows.
          Cooler tone (blue-ish) simulates sky light bouncing in. */}
      <directionalLight position={[-8, 15, -6]} intensity={0.5} color="#b8d4ff" />

      {/* Hemisphere light — THE key to making it feel like a forest.
          Sky color (above) is warm blue. Ground color (below) is 
          green, simulating light reflecting off all the foliage.
          This fills the scene with that lush green ambient glow. */}
      <hemisphereLight
        color="#87ceeb"
        groundColor="#2a6a1a"
        intensity={0.7}
      />

      {/* ======== ATMOSPHERE ======== */}
      
      {/* Atmospheric haze — lighter and further than night fog.
          This creates depth without making things feel claustrophobic.
          The blue-green tint simulates humid tropical air. */}
      <fog attach="fog" args={['#a8c8b0', 25, 55]} />

      {/* Procedural sky — creates a daytime sky dome with sun position.
          The sunPosition vector controls where the "sun" appears.
          Higher Y = noon-ish. This replaces the Stars component. */}
      <Sky
        sunPosition={[10, 20, 10]}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* ======== THE WORLD ======== */}
      <RainforestEnvironment />
      <InteractiveObjects config={interactiveConfig} eatenMushrooms={eatenMushrooms} />

      {/* ======== BUGS — wandering with flee AI ======== */}
      <Bugs frogPosRef={frogPosRef} />

      {/* ======== PORTAL ELEMENTS (Lily Pads) ======== */}
      {elements.map((el) => (
        <GameElement
          key={el.name}
          name={el.name}
          position={el.position}
          color={el.color}
        />
      ))}

      {/* ======== THE FROG ======== */}
      <Frog
        elements={elements}
        interactiveObjects={interactiveConfig}
        eatenMushrooms={eatenMushrooms}
        onElementActivate={onElementActivate}
        onNearElement={onNearElement}
        onColorChange={onColorChange}
        onEatMushroom={handleEatMushroom}
        frogPosRef={frogPosRef}
        gameActive={gameActive}
      />
    </>
  )
}

export default GameScene
