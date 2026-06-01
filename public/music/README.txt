Audio files for the frog portfolio
===================================

Drop the files below into THIS folder (public/music/) using EXACTLY these
filenames. They wire up automatically — no code changes needed.

BACKGROUND MUSIC (looping):

  Absolutely.wav         Song: "Absolutely" by Ryan Harville
                         Plays on every site page (Home, Resume, Education,
                         Projects, Interests). Loops forever until the user
                         mutes or closes the page.

  FrogGameMusic.wav      Song: "FrogGameMusic" by Charlie Kirby
                         Plays only while the Frog Game is open. Loops
                         forever until the user mutes or closes the page.
                         (Also accepts .mp3, .m4a, or .mp4 with the same
                          base filename — Howler picks the first one that
                          loads, so you can swap formats without touching
                          the code.)

  These two songs are MUTUALLY EXCLUSIVE when you enter the game the
  site song fades out and stops, then the game song fades in. They never
  play at the same time.

AMBIENCE (optional, plays underneath the game music):

  forest-ambience.mp3    Looping rainforest bed (cicadas, birds, water).

SOUND EFFECTS (one-shot):

  croak.mp3              Frog croak. Fires automatically every 15s in game.
  hop.mp3                Hop sfx (reserved — not currently triggered).
  munch.mp3              Plays when the frog tongue-eats a mushroom.

Mute button: lives in the bottom-right corner of every page.
Credits:     shown in the top-left of the Home page under the navbar.

Notes:
- Filenames are case-sensitive on production servers — match them exactly.
- Missing files won't crash the app; Howler logs a load error and the
  corresponding sound is silent.
