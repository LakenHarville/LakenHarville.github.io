Audio files for the frog portfolio
===================================

There are exactly TWO songs in the project. Drop them into this folder
(public/music/) using EXACTLY these filenames. They wire up automatically.

  Absolutely.wav         Song: "Absolutely" by Ryan Harville
                         Plays on every page EXCEPT the frog game.
                         Loops forever until muted or the page closes.

  FrogGameMusic.wav      Song: "FrogGameMusic" by Charlie Kirby
                         Plays only while the Frog Game is open.
                         Loops forever until muted or the page closes.
                         (Also accepts .mp3, .m4a, or .mp4 with the same
                          base filename — Howler picks the first one that
                          loads, so swapping formats is zero-config.)

These two songs are MUTUALLY EXCLUSIVE — when you enter the game the site
song fades out and stops, then the game song fades in. They never play at
the same time.

Mute button: bottom-right corner of every page.
Credits:     top-left of the Home page under the navbar.

Notes:
- Filenames are case-sensitive on production servers — match them exactly.
- Missing files won't crash the app; Howler logs a load error and the
  song stays silent.
