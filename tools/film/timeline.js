// Cue times in seconds, shared by the picture (film.html) and the sound (audio.mjs),
// so every sound effect lands on the frame it belongs to.
globalThis.TL = {
  fps: 30,
  duration: 50,
  // Background colour per scene: [start, colour, wipe centre x, wipe centre y]
  bg: [[0, '#0b7a66', 960, 540], [4.5, '#f6efe4', 700, 640], [11, '#14213d', 960, 540], [27, '#ffd8a8', 960, 540], [32, '#8ecae6', 960, 540], [37, '#f6efe4', 960, 540], [44.5, '#0b7a66', 960, 540]],
  s1: { drop: 0.3, land: 0.9, line1: 1.4, line2: 2.7, wave: 3.4 },
  s2: { open: 4.9, items: [5.5, 6.6, 7.7, 8.8, 9.9], close: 10.6 }, // each item flies for 0.7 s
  s3: { slide: [11.6, 13.1], beeps: [13.3, 13.65, 14.0], zoom: [14.4, 15.1] },
  s4: { wraps: [15.6, 17.1, 18.3, 19.5], sneak: [21.2, 22.4], siren: [22.4, 23.6], nice: 22.6, unmask: 22.9, tray: [24.1, 24.8] },
  s5: { coins: [27.8, 30.0], lid: 30.2, bounce: 30.5 },
  s6: { fly: [32.6, 35.8] },
  s7: { bubble: 37.4, reach: [39.4, 40.1], person: 40.3, ahem: 40.6, retract: [40.6, 41.1], press: 42.3 },
  s8: { logo: 44.9, tag: 45.8, stats: [46.5, 46.9, 47.3], url: 47.9 },
  fadeOut: [49.2, 50],
}
