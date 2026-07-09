import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './MusicController.css'

/**
 * MusicController — game music only
 *
 * The site pages (Home, Resume, Education, Projects, Interests) are now
 * silent. Music only plays while the frog game is open. This removed
 * ~24 MB of always-preloaded audio from the main site.
 *
 * The mute button still lives in the corner so the user can silence the
 * game track if they want.
 */
function MusicController() {
  const location = useLocation()
  const gameRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)

  const isGamePage = location.pathname === '/game'

  // Refs the unlock handler reads without re-binding.
  const isMutedRef = useRef(isMuted)
  const isGamePageRef = useRef(isGamePage)
  isMutedRef.current = isMuted
  isGamePageRef.current = isGamePage

  // ---- First user gesture (only relevant if we're on /game) ----
  useEffect(() => {
    const unlock = () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)

      if (isGamePageRef.current && gameRef.current && !isMutedRef.current) {
        gameRef.current.volume = 0.35
        const p = gameRef.current.play()
        if (p && p.catch) {
          p.catch((err) => console.error('[music] play() rejected:', err))
        }
      }
    }
    window.addEventListener('click', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // ---- Route changes: play game music on /game, pause it elsewhere ----
  useEffect(() => {
    if (!gameRef.current) return
    if (isGamePage && !isMuted) {
      gameRef.current.volume = 0.35
      const p = gameRef.current.play()
      if (p && p.catch) p.catch(() => { /* autoplay blocked; will retry on unlock */ })
    } else {
      gameRef.current.pause()
    }
  }, [isGamePage, isMuted])

  // ---- Mute toggle ----
  useEffect(() => {
    if (gameRef.current) gameRef.current.muted = isMuted
  }, [isMuted])

  return (
    <>
      {/*
        preload="none" — the browser doesn't touch this file until we call
        .play(). That means visiting the site (not the game) transfers zero
        audio bytes.
      */}
      <audio
        ref={gameRef}
        src="/music/FrogGameMusic.wav"
        loop
        preload="none"
        onError={(e) => console.error('[music:game] load error', e.currentTarget.error)}
      />

      <button
        className="music-toggle-btn"
        onClick={() => setIsMuted((prev) => !prev)}
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        title={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.17v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    </>
  )
}

export default MusicController
