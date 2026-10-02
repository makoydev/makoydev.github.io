// Cue times in seconds, shared by the picture (film.html) and the sound (audio.mjs),
// so a sound effect always lands on the frame it belongs to.
globalThis.TL = {
  fps: 30,
  duration: 46,
  title: { a: 0.4, b: 2.2, out: 4.4 },
  card: 5.0,
  items: [6.0, 7.0, 8.0, 9.0, 10.0], // each chip flies for 0.6 s, then its line types in
  rail: 11.2,
  scan: [12.0, 14.0],
  // [active, done] for: banned files, secrets, personal data, tricks, budget, boarding
  stations: [[13.6, 14.5], [15.0, 17.2], [18.0, 20.6], [21.5, 22.2], [25.0, 27.2], [27.6, 28.3]],
  secret: [15.3, 15.8, 16.6], // highlight, scramble, wrapped
  pii: [[18.3, 18.5, 19.1], [18.7, 18.9, 19.5], [19.1, 19.3, 19.9]], // NRIC, phone, email
  trick: [22.0, 22.4], // flagged, "reported to a person" tag
  budget: { in: 25.0, count: [25.3, 26.3], bars: [26.4, 27.4], out: [28.2, 28.7] },
  split: [29.0, 30.0],
  fly: [33.2, 34.4],
  comment: 36.0,
  decide: 37.8,
  stamp: 39.2,
  end: 41.2,
  stats: [42.4, 42.8, 43.2],
  url: 43.8,
  fadeOut: [45.2, 46.0],
}
