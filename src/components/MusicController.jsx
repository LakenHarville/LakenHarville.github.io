import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAudioManager } from '../hooks/useAudioManager'
import './MusicController.css'

/**
 * MusicController Component
 * 
 * This component has NO visible UI except a small mute toggle button.
 * Its real job is to watch the URL and automatically crossfade between 
 * the "site music" (home + content pages) and "game music" (frog game) 
 * whenever the user navigates.
 * 
 * WHY A SEPARATE COMPONENT?
 * We could have put this logic in App.jsx, but separating concerns 
 * keeps things clean. App.jsx worries about layout and routes. 
 * MusicController worries about music. If you later want to add 
 * volume sliders, playlist controls, or a "now playing" indicator, 
 * they all live here.
 * 
 * ONE-TIME-UNLOCK PROBLEM:
 * Browsers block audio until ANY user interaction happens. Even 
 * clicking a link counts, but loading a fresh URL doesn't. So the 
 * first music fade-in only works if the user has already clicked 
 * something. If not, we wait for the first click/keypress and try again.
 */
function MusicController() {
  const location = useLocation()
  const audio = useAudioManager()
  const [isMuted, setIsMuted] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Refs that the global unlock handler reads — using refs (not state) lets
  // the handler see the LATEST values without us having to re-bind it every
  // render. Critical because the handler must call .play() synchronously
  // inside the click/keydown event to preserve the user-gesture context
  // that browsers require for audio.
  const isMutedRef = useRef(isMuted)
  const pathnameRef = useRef(location.pathname)
  isMutedRef.current = isMuted
  pathnameRef.current = location.pathname

  // ---- First user interaction: start music synchronously ----
  useEffect(() => {
    const unlock = () => {
      // Strip listeners first so we never re-enter this handler.
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)

      console.log('[audio] first user gesture detected, route=', pathnameRef.current, 'muted=', isMutedRef.current)
      if (!isMutedRef.current) {
        // IMPORTANT: call audio.play* synchronously here. Going through a
        // setState → re-render → effect path delays the play() call past the
        // event-loop tick the gesture lives in, and some browsers (Safari,
        // older Chrome) treat the gesture as expired and silently refuse.
        if (pathnameRef.current === '/game') {
          audio.playGameMusic(0.35)
          audio.startForestAmbience(0.18)
        } else {
          audio.playSiteMusic(0.25)
        }
      }
      setHasInteracted(true)
    }
    window.addEventListener('click', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [audio])

  // ---- Switch music when route changes (after first interaction) ----
  useEffect(() => {
    if (!hasInteracted || isMuted) return

    const isGamePage = location.pathname === '/game'
    if (isGamePage) {
      audio.playGameMusic(0.35)
      audio.startForestAmbience(0.18)
    } else {
      audio.playSiteMusic(0.25)
      audio.stopForestAmbience()
    }
  }, [location.pathname, hasInteracted, isMuted, audio])

  // ---- Handle mute toggle ----
  useEffect(() => {
    audio.mute(isMuted)
  }, [isMuted, audio])

  return (
    <button
      className="music-toggle-btn"
      onClick={() => setIsMuted((prev) => !prev)}
      aria-label={isMuted ? 'Unmute music' : 'Mute music'}
      title={isMuted ? 'Unmute music' : 'Mute music'}
    >
      {isMuted ? (
        // Muted icon
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.17v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      ) : (
        // Playing icon
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      )}
    </button>
  )
}

export default MusicController
