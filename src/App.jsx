import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import MusicController from './components/MusicController'
import Home from './pages/Home'
import Resume from './pages/Resume'
import Education from './pages/Education'
import Projects from './pages/Projects'
import Interests from './pages/Interests'
import FrogGame from './components/FrogGame/FrogGame'
import './App.css'

/**
 * App Component — The Root Orchestrator
 * 
 * Think of this like a building's floor plan. The <Routes> component
 * is the hallway, and each <Route> is a door to a different room.
 * React Router watches the URL and renders ONLY the component whose
 * path matches — no full page reload needed. This is what makes it
 * a Single Page Application (SPA).
 * 
 * The Navbar and MusicController live OUTSIDE the Routes, so they 
 * persist across all pages. MusicController detects route changes 
 * and crossfades music between site pages and the game.
 */
function App() {
  // Orbs render on the Home page ONLY. They're the most expensive CSS
  // element on the site (filter: blur(100px) + mix-blend-mode: screen), so
  // restricting them to one page — and freezing their animation via CSS —
  // trims a lot of continuous GPU work on Resume/Education/Projects/etc.
  const location = useLocation()
  const showBgEffects = location.pathname === '/'

  return (
    <div className="app">
      {/*
        Background effects layer — sits behind all content.
        Five blurred orbs drift on multi-stage paths with subtle rotation
        and scaling. mix-blend-mode: screen makes their overlaps glow
        additively, selling the "slow flame" feel.
      */}
      {showBgEffects && (
        <div className="bg-effects">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
          <div className="bg-orb bg-orb-4"></div>
          <div className="bg-orb bg-orb-5"></div>
        </div>
      )}

      <Navbar />
      <MusicController />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<FrogGame />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/education" element={<Education />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/interests" element={<Interests />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
