import { useEffect } from 'react'
import { Howl, Howler } from 'howler'

// Bump Howler's HTML5 audio node pool from the default 10 → 30. Each
// looping html5 track (siteMusic, gameMusic, forestAmbience) holds a node
// for its entire playback, and SFX briefly grab nodes too. With React's
// route effect potentially firing several times during navigation, the
// default pool fills up and Howler returns "potentially locked" nodes
// that refuse to play.
Howler.html5PoolSize = 30

/**
 * useAudioManager — Centralized Audio Hook
 *
 * Two-layer audio in the frog game:
 *   1. Game music (frog soundtrack, main volume)
 *   2. Forest ambience (cicadas/birds/water, subtle bed underneath)
 *
 * On non-game pages only the site music plays. The forest ambience auto-fades
 * out when the user leaves the frog game.
 *
 * Audio files expected (drop in `public/music/`):
 *   - Absolutely.wav        Background music for ALL site pages
 *                             (composer: Ryan Harville)
 *   - FrogGameMusic.mp4     Frog game soundtrack
 *                             (composer: Charlie Kirby)
 *   - forest-ambience.mp3   Looping rainforest sounds (birds, cicadas, water)
 *   - croak.mp3             One-shot frog croak (fires every 15s in game)
 *   - hop.mp3               One-shot hop sfx
 *   - munch.mp3             One-shot mushroom eating sfx
 *
 * SWAPPING SONGS: Just replace the file at the matching path in public/music/.
 * Filenames are intentionally fixed so songs drop in with zero code changes.
 *
 * SITE vs. GAME MUSIC ARE MUTUALLY EXCLUSIVE: crossfadeTo() always stops the
 * outgoing track, so the two songs are never both audible as background.
 *
 * Missing files won't crash anything — Howler logs a load error and play()
 * calls are wrapped in try/catch.
 */

const audioEngine = {
  siteMusic: null,
  gameMusic: null,
  forestAmbience: null,   // NEW: plays alongside game music
  croak: null,
  hop: null,
  munch: null,
  currentTrack: null,
  ambiencePlaying: false,
  initialized: false,
}

function initializeAudio() {
  if (audioEngine.initialized) return

  try {
    // Error reporters surface load/play failures in the console so we can
    // see exactly why a track is silent (404, codec rejection, autoplay
    // block, etc.) instead of guessing.
    const logErr = (label) => (id, err) =>
      console.error(`[audio:${label}]`, err, '(soundId:', id, ')')

    // ---- Site music: "Absolutely" by Ryan Harville ----
    audioEngine.siteMusic = new Howl({
      src: ['/music/Absolutely.wav'],
      format: ['wav'],
      loop: true,
      volume: 0,
      html5: true,
      preload: true,
      onload: () => console.log('[audio:siteMusic] LOADED'),
      onplay: () => console.log('[audio:siteMusic] PLAY started'),
      onloaderror: logErr('siteMusic load'),
      onplayerror: (id, err) => {
        console.warn('[audio:siteMusic play] retrying after unlock', err)
        audioEngine.siteMusic.once('unlock', () => audioEngine.siteMusic.play(id))
      },
    })

    // ---- Game music: "FrogGameMusic" by Charlie Kirby ----
    // Howler tries each src in order until one loads. WAV is the active
    // file; the others act as drop-in fallbacks so swapping formats later
    // is zero-config — just put the new file in the folder.
    audioEngine.gameMusic = new Howl({
      src: [
        '/music/FrogGameMusic.wav',
        '/music/FrogGameMusic.mp3',
        '/music/FrogGameMusic.m4a',
        '/music/FrogGameMusic.mp4',
      ],
      format: ['wav', 'mp3', 'm4a', 'mp4'],
      loop: true,
      volume: 0,
      html5: true,
      preload: true,
      onload: () => console.log('[audio:gameMusic] LOADED'),
      onplay: () => console.log('[audio:gameMusic] PLAY started'),
      onloaderror: logErr('gameMusic load'),
      onplayerror: (id, err) => {
        console.warn('[audio:gameMusic play] retrying after unlock', err)
        audioEngine.gameMusic.once('unlock', () => audioEngine.gameMusic.play(id))
      },
    })

    // ---- Forest ambience — looping bed of nature sounds under the music ----
    // Not html5 (file is small, uses Web Audio buffer instead) — removes one
    // of the "pool exhausted" warnings and is cheaper to play.
    audioEngine.forestAmbience = new Howl({
      src: ['/music/forest-ambience.mp3'],
      loop: true,
      volume: 0,
      preload: true,
    })

    audioEngine.croak = new Howl({
      src: ['/music/croak.mp3'],
      volume: 0.7,
      preload: true,
    })

    audioEngine.hop = new Howl({
      src: ['/music/hop.mp3'],
      volume: 0.3,
      preload: true,
    })

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
 * Switch between site and game music with NO audio overlap.
 *
 * The two tracks are mutually exclusive: the outgoing one fully fades out
 * and stops BEFORE the new one starts. This honors the rule "neither song
 * should intersect" while still sounding smooth (short fade vs. hard cut).
 *
 * Timeline:
 *   0ms ────── fadeOutMs ────── fadeOutMs+gap ────── +fadeInMs
 *   |                          |                    |
 *   old.fade(→0)               new.play() + fade(0→target)
 *
 * If nothing is currently playing, the outgoing step is skipped and the new
 * track starts immediately.
 */
function crossfadeTo(targetTrack, targetVolume = 0.4, fadeOutMs = 700, fadeInMs = 900) {
  initializeAudio()
  if (!audioEngine.initialized) return

  const { siteMusic, gameMusic, currentTrack } = audioEngine

  if (currentTrack === targetTrack) return
  audioEngine.currentTrack = targetTrack

  // Start `howl` only if it's not already playing. Howler treats every
  // .play() as a NEW playback instance and grabs a fresh pool node; firing
  // .play() repeatedly on the same loop track is what exhausts the pool.
  const playOnce = (howl, vol) => {
    if (howl.playing()) {
      howl.fade(howl.volume(), vol, fadeInMs)
      return
    }
    howl.volume(0)
    howl.play()
    howl.fade(0, vol, fadeInMs)
  }

  const startTarget = () => {
    if (audioEngine.currentTrack !== targetTrack) return // user moved again
    if (targetTrack === 'site' && siteMusic) {
      try { playOnce(siteMusic, targetVolume) }
      catch (e) { console.warn('Site music play failed:', e) }
    } else if (targetTrack === 'game' && gameMusic) {
      try { playOnce(gameMusic, targetVolume) }
      catch (e) { console.warn('Game music play failed:', e) }
    }
  }

  // Fade out whichever track is currently active, then start the new one.
  if (currentTrack === 'site' && siteMusic?.playing()) {
    siteMusic.fade(siteMusic.volume(), 0, fadeOutMs)
    setTimeout(() => {
      siteMusic.stop()
      startTarget()
    }, fadeOutMs + 50)
  } else if (currentTrack === 'game' && gameMusic?.playing()) {
    gameMusic.fade(gameMusic.volume(), 0, fadeOutMs)
    setTimeout(() => {
      gameMusic.stop()
      startTarget()
    }, fadeOutMs + 50)
  } else {
    startTarget()
  }
}

/**
 * Start (or keep playing) the forest ambience bed.
 *
 * Kept subtle by default (volume ~0.18) so the music sits on top. The user
 * said "nothing overwhelming because the soundtrack is playing alongside."
 */
function startForestAmbience(volume = 0.18, duration = 2000) {
  initializeAudio()
  const a = audioEngine.forestAmbience
  if (!a) return
  if (audioEngine.ambiencePlaying) return
  try {
    a.volume(0)
    a.play()
    a.fade(0, volume, duration)
    audioEngine.ambiencePlaying = true
  } catch (e) {
    console.warn('Forest ambience play failed:', e)
  }
}

function stopForestAmbience(duration = 1200) {
  const a = audioEngine.forestAmbience
  if (!a) return
  if (!audioEngine.ambiencePlaying) return
  try {
    a.fade(a.volume(), 0, duration)
    setTimeout(() => a.stop(), duration)
    audioEngine.ambiencePlaying = false
  } catch (e) {
    console.warn('Forest ambience stop failed:', e)
  }
}

function stopAll() {
  if (audioEngine.siteMusic?.playing()) audioEngine.siteMusic.stop()
  if (audioEngine.gameMusic?.playing()) audioEngine.gameMusic.stop()
  if (audioEngine.forestAmbience?.playing()) audioEngine.forestAmbience.stop()
  audioEngine.currentTrack = null
  audioEngine.ambiencePlaying = false
}

function playSFX(name) {
  initializeAudio()
  const sound = audioEngine[name]
  if (sound) {
    try { sound.play() } catch (e) { console.warn(`SFX ${name} failed:`, e) }
  }
}

// The API object is stable across renders so React effects with `audio` in
// their deps array don't re-fire every render. (Previously this was a fresh
// literal each call, which kept retriggering the route-change effect.)
const apiObject = {
  playSiteMusic: (volume) => crossfadeTo('site', volume),
  playGameMusic: (volume) => crossfadeTo('game', volume),
  startForestAmbience,
  stopForestAmbience,
  stopAll,
  playSFX,
  setGlobalVolume: (v) => Howler.volume(v),
  mute: (m) => Howler.mute(m),
}

export function useAudioManager() {
  useEffect(() => {
    initializeAudio()
  }, [])

  return apiObject
}

export const audioAPI = {
  playSFX,
  playSiteMusic: (v) => crossfadeTo('site', v),
  playGameMusic: (v) => crossfadeTo('game', v),
  startForestAmbience,
  stopForestAmbience,
  stopAll,
}
