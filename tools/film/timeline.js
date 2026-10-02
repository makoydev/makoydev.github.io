// Cue times in seconds, shared by the picture (film.html) and the sound (audio.mjs).
// The music runs at 120 BPM (one beat every 0.5 s) and every visual hit sits on that grid,
// so the animation and the soundtrack land together.
globalThis.TL = {
  fps: 30,
  duration: 30,
  bpm: 120,
  title: { a: 0.25, b: 1.25, out: 2.6 },
  card: 3.0,
  items: [3.1, 3.6, 4.1, 4.6, 5.1], // each chip flies for 0.4 s and lands on a beat
  fly: 0.4,
  rail: 6.0,
  scan: [6.5, 8.0],
  // [active, done] for: banned files, secrets, personal data, tricks, budget, boarding
  stations: [[7.5, 8.0], [8.5, 9.5], [10.0, 11.5], [12.0, 12.5], [13.5, 15.0], [15.5, 16.0]],
  secret: [8.5, 8.6, 9.0], // highlight, scramble, wrapped
  pii: [[10.0, 10.1, 10.5], [10.5, 10.6, 11.0], [11.0, 11.1, 11.5]], // NRIC, phone, email
  trick: [12.0, 12.5], // flagged, "reported to a person" tag + "Nice try."
  budget: { in: 13.5, count: [13.75, 14.5], bars: [14.5, 15.25], out: [15.75, 16.25] },
  split: [16.5, 17.25],
  plane: [19.0, 20.0],
  comment: 20.5,
  decide: 21.5,
  stamp: 22.5,
  end: 24.5,
  stats: [25.5, 26.0, 26.5],
  url: 27.0,
  fadeOut: [29.25, 30.0],
}
