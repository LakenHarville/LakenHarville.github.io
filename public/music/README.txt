Audio files for the frog portfolio
===================================

Only one song is used on the site — the frog game soundtrack. The main
site pages are silent.

  FrogGameMusic.wav      Song: "FrogGameMusic" by Charlie Kirby
                         Plays only while the Frog Game is open.
                         Loops forever until muted or the page closes.
                         (Also accepts .mp3, .m4a, or .mp4 with the same
                          base filename — the <audio> element's src will
                          need to be updated to match if you swap formats.)

Mute button: bottom-right corner of every page.
Credit:      top-left of the Home page, under the navbar.

Note: preload="none" is set on the audio element, so the file is not
downloaded until the user actually enters the frog game.
