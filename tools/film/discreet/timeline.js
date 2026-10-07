// Cue times in seconds for the Discreet film, shared by film.html and
// audio.mjs. 120 BPM: one beat every 0.5 s. Messages move through the
// Discreet wall in hops, so each value crosses it exactly on a beat.
globalThis.TL = {
  fps: 30,
  duration: 30,
  bpm: 120,
  title: { a: 0.25, b: 1.25, out: 2.6 },
  scene: 3.0, // app, wall and AI appear
  type: [4.5, 5.5], // the app's message types in
  out: { start: 6.0, cross: [6.5, 7.0, 7.5, 8.0], arrive: 8.5 },
  reply: [9.5, 10.75], // the AI types its reply (placeholders only)
  back: { start: 11.0, cross: [11.5, 12.0, 12.5, 13.0], arrive: 13.5 },
  footer: 13.75,
  refusal: { in: 15.0, start: 15.5, hit: 16.5, home: 17.25 },
  audit: { in: 18.75, blocks: [19.0, 19.5, 20.0, 20.5], edit: 21.5, verify: 22.0, fail: 22.5 },
  end: 24.5,
  stats: [25.5, 26.0, 26.5],
  url: 27.0,
  fadeOut: [29.25, 30.0],
}
