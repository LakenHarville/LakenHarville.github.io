import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './MusicController.css'

/**
 * MusicController — plain HTML5 <audio> implementation
 *
 * Why no Howler.js anymore: Howler's HTML5 audio pool kept hitting
 * "potentially locked" states on the large WAV files, and the abstractions
 * obscured what the browser was actually doing. Going straight to the
 * platform <audio> element makes the lifecycle obvious and lets you debug
 * with the browser's normal media tooling.
 *
 * Two <audio> elements live in the DOM, one per song. The browser preloads
 * them. We swap which one is .play()-ing based on the route and toggle
 * .muted on both for the mute button.
 *
 * Autoplay rule: the first .play() must happen INSIDE the click/keydown
 * event handler — that's why the first-gesture listener calls .play()
 * synchronously rather than via setState → effect.
 */
function MusicController() {
  const location = useLocation()
  const siteRef = useRef(null)
  const gameRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Refs the global unlock handler reads — using refs (not state) lets
  // the handler see the latest route/mute without rebinding the listener.
  const isMutedRef = useRef(isMuted)
  const pathnameRef = useRef(location.pathname)
  isMutedRef.current = isMuted
  pathnameRef.current = location.pathname

  // ---- First user gesture: start the appropriate track synchronously ----
  useEffect(() => {
    const unlock = () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)

      const isGame = pathnameRef.current === '/game'
      const target = isGame ? gameRef.current : siteRef.current
      const other = isGame ? siteRef.current : gameRef.current

      console.log('[music] first gesture, route=', pathnameRef.current,
        'muted=', isMutedRef.current,
        'target loaded?', target?.readyState)

      if (other) other.pause()
      if (target && !isMutedRef.current) {
        target.volume = isGame ? 0.35 : 0.25
        target.currentTime = target.currentTime || 0
        const p = target.play()
        if (p && p.catch) {
          p.then(() => console.log('[music] play OK'))
           .catch((err) => console.error('[music] play() rejected:', err))
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
  }, [])

  // ---- Route changes (after first interaction): swap which track plays ----
  useEffect(() => {
    if (!hasInteracted) return
    const isGame = location.pathname === '/game'
    const target = isGame ? gameRef.current : siteRef.current
    const other = isGame ? siteRef.current : gameRef.current
    if (other) other.pause()
    if (target && !isMuted) {
      target.volume = isGame ? 0.35 : 0.25
      const p = target.play()
      if (p && p.catch) p.catch((err) => console.error('[music] play() rejected on route:', err))
    }
  }, [location.pathname, hasInteracted, isMuted])

  // ---- Mute toggle: applies to both audio elements ----
  useEffect(() => {
    if (siteRef.current) siteRef.current.muted = isMuted
    if (gameRef.current) gameRef.current.muted = isMuted
  }, [isMuted])

  return (
    <>
      {/*
        Hidden audio elements. `preload="auto"` lets the browser start
        buffering immediately. `loop` makes them repeat forever. We DON'T
        set `autoplay` because every browser ignores autoplay without a
        user gesture — we call .play() ourselves on the first click.
      */}
      <audio
        ref={siteRef}
        src="/music/Absolutely.wav"
        loop
        preload="auto"
        onError={(e) => console.error('[music:site] load error', e.currentTarget.error)}
        onCanPlay={() => console.log('[music:site] canplay')}
      />
      <audio
        ref={gameRef}
        src="/music/FrogGameMusic.wav"
        loop
        preload="auto"
        onError={(e) => console.error('[music:game] load error', e.currentTarget.error)}
        onCanPlay={() => console.log('[music:game] canplay')}
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
