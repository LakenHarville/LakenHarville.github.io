import { useEffect, useRef } from 'react'
import { Howl, Howler } from 'howler'

/**
 * useAudioManager — Centralized Audio Hook
 * 
 * PROBLEM WE'RE SOLVING:
 * If every page creates its own Howl instance, you'd get:
 * - Multiple tracks playing at once when navigating between pages
 * - Jarring cuts instead of smooth fades
 * - Each page reloading the audio file (bandwidth waste)
 * 
 * THE PATTERN:
 * We create ONE set of Howl instances stored in a module-level object.
 * The hook returns control functions (play, stop, fade). Every page 
 * that mounts calls these functions — they all talk to the SAME audio 
 * engine. Like a radio station: many listeners, one broadcast.
 * 
 * WHY MODULE-LEVEL STATE?
 * Variables declared outside the hook function persist across ALL 
 * components using the hook. If we put them inside the hook, each 
 * component would get its own copy — defeating the whole purpose.
 * This is the JavaScript equivalent of a "static" variable in other 
 * languages.
 * 
 * BROWSER AUTOPLAY POLICY:
 * Modern browsers block audio until the user interacts with the page.
 * Howler.js tries to auto-unlock on first touch/click, but we wrap 
 * play() calls in try/catch just in case.
 */

// Module-level singleton — lives outside the hook
const audioEngine = {
  siteMusic: null,       // Shared music for all 5 content pages
  gameMusic: null,       // Separate track for the frog game
  croak: null,           // Frog croak SFX
  hop: null,             // Hop SFX (optional, wire up later)
  munch: null,           // Mushroom eating SFX
  currentTrack: null,    // Tracks which music is active: 'site' | 'game' | null
  initialized: false,
}

/**
 * Initialize all Howl instances. Called exactly once.
 * Using try/catch because if an audio file is missing, we don't 
 * want the whole app to crash — just log it and keep going.
 */
function initializeAudio() {
  if (audioEngine.initialized) return

  try {
    // ---- Site music (Home + Resume + Education + Projects + Interests) ----
    audioEngine.siteMusic = new Howl({
      src: ['/music/site-music.mp3'],
      loop: true,
      volume: 0,        // Start silent — we'll fade in
      html5: true,      // HTML5 audio streams large files better than Web Audio
      preload: true,
    })

    // ---- Game music (Frog game only) ----
    audioEngine.gameMusic = new Howl({
      src: ['/music/game-music.mp3'],
      loop: true,
      volume: 0,
      html5: true,
      preload: true,
    })

    // ---- Croak SFX (plays every 15s in-game) ----
    audioEngine.croak = new Howl({
      src: ['/music/croak.mp3'],
      volume: 0.6,
      preload: true,
    })

    // ---- Hop SFX (optional) ----
    audioEngine.hop = new Howl({
      src: ['/music/hop.mp3'],
      volume: 0.3,
      preload: true,
    })

    // ---- Munch SFX (when frog eats a mushroom) ----
    audioEngine.munch = new Howl({
      src: ['/music/munch.mp3'],
      volume: 0.5,
      preload: true,
    })

    audioEngine.initialized = true
  } catch (err) {
    console.warn('Audio initialization failed:', err)
  }
}

/**
 * Crossfade between tracks.
 * 
 * Howler's built-in fade() method handles the math — we just tell it 
 * the start volume, end volume, and duration in milliseconds.
 * 
 * Analogy: A DJ has two turntables. Instead of abruptly stopping one 
 * record to start the next, they gradually fade one down while fading 
 * the other up. The listener never experiences silence or a jarring cut.
 */
function crossfadeTo(targetTrack, targetVolume = 0.4, duration = 1500) {
  initializeAudio()
  if (!audioEngine.initialized) return

  const { siteMusic, gameMusic, currentTrack } = audioEngine

  // Nothing to do if we're already on this track
  if (currentTrack === targetTrack) return

  // Fade out the current track
  if (currentTrack === 'site' && siteMusic?.playing()) {
    siteMusic.fade(siteMusic.volume(), 0, duration)
    setTimeout(() => siteMusic.stop(), duration)
  } else if (currentTrack === 'game' && gameMusic?.playing()) {
    gameMusic.fade(gameMusic.volume(), 0, duration)
    setTimeout(() => gameMusic.stop(), duration)
  }

  // Fade in the new track
  if (targetTrack === 'site' && siteMusic) {
    try {
      siteMusic.volume(0)
      siteMusic.play()
      siteMusic.fade(0, targetVolume, duration)
    } catch (e) { console.warn('Site music play failed:', e) }
  } else if (targetTrack === 'game' && gameMusic) {
    try {
      gameMusic.volume(0)
      gameMusic.play()
      gameMusic.fade(0, targetVolume, duration)
    } catch (e) { console.warn('Game music play failed:', e) }
  }

  audioEngine.currentTrack = targetTrack
}

/**
 * Stop all music entirely (used when music is muted).
 */
function stopAll() {
  if (audioEngine.siteMusic?.playing()) audioEngine.siteMusic.stop()
  if (audioEngine.gameMusic?.playing()) audioEngine.gameMusic.stop()
  audioEngine.currentTrack = null
}

/**
 * Play a one-shot sound effect.
 * These don't loop — just fire and forget.
 */
function playSFX(name) {
  initializeAudio()
  const sound = audioEngine[name]
  if (sound) {
    try { sound.play() } catch (e) { console.warn(`SFX ${name} failed:`, e) }
  }
}

/**
 * Hook wrapper — returns the control API.
 * 
 * The useEffect ensures initialization happens after the component mounts 
 * (which means after the user has likely clicked something → audio unlocked).
 */
export function useAudioManager() {
  useEffect(() => {
    initializeAudio()
  }, [])

  return {
    playSiteMusic: (volume) => crossfadeTo('site', volume),
    playGameMusic: (volume) => crossfadeTo('game', volume),
    stopAll,
    playSFX,
    setGlobalVolume: (v) => Howler.volume(v),
    mute: (m) => Howler.mute(m),
  }
}

/**
 * Export the direct API too, for use OUTSIDE React components 
 * (like in the Frog's useFrame game loop — can't call hooks there!)
 */
export const audioAPI = {
  playSFX,
  playSiteMusic: (v) => crossfadeTo('site', v),
  playGameMusic: (v) => crossfadeTo('game', v),
  stopAll,
}
