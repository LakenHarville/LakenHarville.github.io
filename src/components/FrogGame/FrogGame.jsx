import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { useNavigate, Link } from 'react-router-dom'
import GameScene from './GameScene'
import './FrogGame.css'

/**
 * FrogGame v2 — Rainforest Edition
 * 
 * The wrapper component manages everything OUTSIDE the 3D canvas:
 * - Instructions overlay (how to play)
 * - HUD (proximity indicator, legend, back button)
 * - Loading state (while Three.js assets initialize)
 * - Route navigation (when portals are activated)
 * 
 * ARCHITECTURE RECAP:
 * This component lives in normal React DOM world. The <Canvas> creates 
 * a separate Three.js world. They communicate via callbacks passed as 
 * props — like walkie-talkies between two different rooms.
 */
function FrogGame() {
  const navigate = useNavigate()
  const [nearElement, setNearElement] = useState(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [frogColor, setFrogColor] = useState('#00e87b')

  const handleElementActivate = useCallback((elementName) => {
    const routes = {
      'Resume': '/resume',
      'Education': '/education',
      'Projects': '/projects',
      'Interests': '/interests',
    }
    if (routes[elementName]) {
      navigate(routes[elementName])
    }
  }, [navigate])

  const handleNearElement = useCallback((elementName) => {
    setNearElement(elementName)
  }, [])

  const handleColorChange = useCallback((color) => {
    setFrogColor(color)
  }, [])

  return (
    <div className="frog-game-wrapper">
      {/* Back link — rendered OUTSIDE .game-hud so its real <a href> isn't
          blocked by any pointer-events: none from the HUD container. Uses
          React Router's Link, so the browser sees a normal anchor tag and
          the navigation actually happens. */}
      <Link
        to="/"
        className="hud-back-btn"
        onClick={() => console.log('[nav] back-to-home clicked')}
      >
        ← Back to Home
      </Link>

      {/* ======== GAME HUD ======== */}
      <div className="game-hud">

        {/* Instructions overlay */}
        {showInstructions && (
          <div className="game-instructions-overlay">
            <div className="game-instructions-card">
              <div className="instructions-frog-icon">🐸</div>
              <h2>Rainforest Explorer</h2>
              <p className="instructions-intro">
                Hop through a living rainforest to discover Laken's portfolio!
              </p>

              <div className="controls-grid">
                <div className="control-item">
                  <div className="key-group">
                    <kbd>W</kbd>
                    <div className="key-row">
                      <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                    </div>
                  </div>
                  <span>Hop Around</span>
                </div>
                <div className="control-item">
                  <kbd className="key-wide">Space</kbd>
                  <span>Big Hop & Activate Lily Pads</span>
                </div>
                <div className="control-item">
                  <kbd className="key-wide">F</kbd>
                  <span>Lick & Eat Mushrooms</span>
                </div>
              </div>

              <div className="instructions-features">
                <div className="feature-item">🍄 Eat mushrooms with <kbd>F</kbd> to change color</div>
                <div className="feature-item">🐞 Bugs wander around they'll flee if you get close</div>
                <div className="feature-item">🌿 Disturb reeds to find secrets</div>
                <div className="feature-item">💧 Hop near puddles to see creatures</div>
                <div className="feature-item">🌺 Find the lily pad portals to explore</div>
                <div className="feature-item">⬆ Bounce on special lily pads!</div>
              </div>

              <button
                className="start-game-btn"
                onClick={() => setShowInstructions(false)}
              >
                Enter the Rainforest
              </button>
            </div>
          </div>
        )}

        {/* Proximity indicator */}
        {nearElement && !showInstructions && (
          <div className="proximity-indicator">
            <span className="proximity-pulse"></span>
            Press <kbd>Space</kbd> to visit <strong>{nearElement}</strong>
          </div>
        )}

        {/* Legend */}
        {!showInstructions && (
          <div className="element-legend">
            <div className="legend-title">Find the Lily Pads</div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#00e87b' }}></span>
              Resume
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#4d7aff' }}></span>
              Education
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#a855f7' }}></span>
              Projects
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
              Interests
            </div>
          </div>
        )}

        {/* Frog color indicator */}
        {!showInstructions && (
          <div className="frog-color-indicator">
            <span
              className="color-swatch"
              style={{ background: frogColor, boxShadow: `0 0 10px ${frogColor}` }}
            ></span>
            <span className="color-label">Frog</span>
          </div>
        )}

        {/* Mini control reminder */}
        {!showInstructions && (
          <div className="controls-reminder">
            <span><kbd>WASD</kbd> Move</span>
            <span><kbd>Space</kbd> Hop/Activate</span>
            <span><kbd>F</kbd> Lick</span>
          </div>
        )}
      </div>

      {/* ======== 3D CANVAS ======== */}
      <Canvas
        shadows
        camera={{ position: [0, 10, 19], fov: 50 }}
        className="game-canvas"
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <GameScene
            onElementActivate={handleElementActivate}
            onNearElement={handleNearElement}
            onColorChange={handleColorChange}
            gameActive={!showInstructions}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default FrogGame
