// Generates the film's soundtrack as a WAV file: an upbeat marimba-and-bass track plus
// cartoon sound effects on the cues in timeline.js. Everything is synthesised from tones
// (no noise sweeps, no samples to licence). Usage: node audio.mjs out.wav
import fs from 'node:fs'
import './timeline.js'

const TL = globalThis.TL
const SR = 48000
const N = Math.ceil(TL.duration * SR)
const L = new Float32Array(N)
const R = new Float32Array(N)
const DUCK = new Float32Array(N).fill(1) // music gain, lowered under some effects

let seed = 20261002
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d))

function add(t0, dur, fn, gain = 1, pan = 0, music = false) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR)
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan)
  for (let i = 0; i < n; i++) {
    const k = s0 + i
    if (k < 0 || k >= N) continue
    const v = fn(i / SR) * (music ? DUCK[k] : 1)
    L[k] += v * gl
    R[k] += v * gr
  }
}
function duck(t0, t1, level) { for (let k = Math.floor(t0 * SR); k < Math.min(N, t1 * SR); k++) if (k >= 0) DUCK[k] = Math.min(DUCK[k], level) }
// Phase-accumulating oscillator, so pitch can sweep smoothly.
function osc(freqAt, shape = 'sine') {
  let ph = 0
  return (s) => {
    ph += (2 * Math.PI * freqAt(s)) / SR
    if (shape === 'square') return Math.sin(ph) + Math.sin(3 * ph) / 3 + Math.sin(5 * ph) / 5
    if (shape === 'buzz') return Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.33 * Math.sin(3 * ph) + 0.25 * Math.sin(4 * ph)
    return Math.sin(ph)
  }
}

// ----- Instruments -----
function marimba(t, m, gain = 0.3, pan = 0, music = false) {
  const f = hz(m)
  add(t, 0.9, (s) => (Math.sin(2 * Math.PI * f * s) * Math.exp(-s / 0.32) + 0.35 * Math.sin(2 * Math.PI * f * 3.99 * s) * Math.exp(-s / 0.03)) * Math.min(1, s / 0.002), gain, pan, music)
}
function bass(t, m, dur, gain = 0.2) {
  const f = hz(m)
  add(t, dur, (s) => (Math.sin(2 * Math.PI * f * s) + 0.3 * Math.sin(4 * Math.PI * f * s)) * Math.min(1, s / 0.005) * Math.exp(-s / (dur * 0.7)), gain, 0, true)
}
function kick(t, gain = 0.3) { const o = osc((s) => 48 + 90 * Math.exp(-s / 0.025)); add(t, 0.3, (s) => o(s) * env(s, 0.002, 0.09), gain, 0, true) }
function block(t, gain = 0.07, f = 1600) { add(t, 0.05, (s) => Math.sin(2 * Math.PI * f * s) * env(s, 0.0005, 0.012), gain, 0.3, true) }

// ----- Cartoon effects (all tonal) -----
const boing = (t, base = 220, gain = 0.32) => { const o = osc((s) => base * (1 + 0.9 * Math.exp(-s / 0.05)) * (1 + 0.12 * Math.sin(2 * Math.PI * 22 * s) * Math.exp(-s / 0.25))); add(t, 0.5, (s) => o(s) * env(s, 0.003, 0.16), gain) }
const pop = (t, gain = 0.35, hi = 1100, lo = 380) => { const o = osc((s) => lo + (hi - lo) * Math.exp(-s / 0.02)); add(t, 0.14, (s) => o(s) * env(s, 0.001, 0.04), gain) }
const slide = (t, from, to, dur, gain = 0.2) => { const o = osc((s) => (from * Math.pow(to / from, Math.min(1, s / dur))) * (1 + 0.02 * Math.sin(2 * Math.PI * 6 * s))); add(t, dur + 0.05, (s) => o(s) * Math.min(1, s / 0.02, (dur + 0.05 - s) / 0.05), gain) }
const run = (t, notes, step = 0.045, gain = 0.18) => notes.forEach((m, i) => marimba(t + i * step, m, gain, (i / notes.length - 0.5) * 0.6))
const ding = (t, m, gain = 0.22, decay = 0.9) => { const f = hz(m); add(t, decay * 3, (s) => [1, 2.76, 5.4].reduce((a, k, i) => a + Math.sin(2 * Math.PI * f * k * s) * [1, 0.35, 0.12][i] * Math.exp(-s / (decay / (i + 1))), 0) * Math.min(1, s / 0.002), gain) }
const coin = (t, m, gain = 0.16) => { ding(t, m, gain, 0.25); ding(t + 0.06, m + 5, gain * 0.8, 0.3) }
const clunk = (t, gain = 0.45) => { const o = osc((s) => 70 + 80 * Math.exp(-s / 0.03)); add(t, 0.3, (s) => o(s) * env(s, 0.002, 0.08), gain); pop(t, 0.15, 500, 200) }
const beep = (t, f = 1200, gain = 0.14) => add(t, 0.16, (s) => Math.sin(2 * Math.PI * f * s) * Math.min(1, s / 0.005, (0.16 - s) / 0.01), gain)
const bleep = (t, m, gain = 0.11) => { const f = hz(m), o = osc(() => f, 'square'); add(t, 0.09, (s) => o(s) * Math.min(1, s / 0.004, (0.09 - s) / 0.01), gain) }
const honk = (t, m, dur = 0.22, gain = 0.12) => { const f = hz(m), o = osc((s) => f * (1 - 0.06 * s / dur), 'buzz'); add(t, dur, (s) => o(s) * Math.min(1, s / 0.01, (dur - s) / 0.03), gain) }
const pizz = (t, m, gain = 0.16) => { const f = hz(m); add(t, 0.25, (s) => (Math.sin(2 * Math.PI * f * s) + 0.4 * Math.sin(4 * Math.PI * f * s)) * env(s, 0.002, 0.05), gain) }
function siren(t0, t1, gain = 0.13) {
  const o = osc((s) => (Math.floor(s / 0.3) % 2 ? 660 : 880) * (1 + 0.01 * Math.sin(2 * Math.PI * 7 * s)))
  add(t0, t1 - t0, (s) => o(s) * Math.min(1, s / 0.03, (t1 - t0 - s) / 0.08), gain)
}

// ----- Music: 112 BPM, C - G - Am - F -----
const BEAT = 60 / 112, BAR = BEAT * 4
const CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
const ROOT = [36, 43, 45, 41]
const musicStart = TL.s1.land, musicEnd = TL.s8.logo - 0.6
for (let bar = 0; ; bar++) {
  const t0 = musicStart + bar * BAR
  if (t0 >= musicEnd) break
  const c = CH[bar % 4], full = t0 >= TL.s2.open - 0.2
  for (let b = 0; b < 8; b++) {
    const t = t0 + (b * BEAT) / 2
    if (t >= musicEnd) break
    if (b % 2 === 1) c.forEach((m, i) => marimba(t, m + 12, 0.045, i - 1, true)) // off-beat chord stabs
    if (full) {
      if (b === 0 || b === 3 || b === 4) bass(t, ROOT[bar % 4], BEAT * 0.9)
      if (b % 2 === 0) kick(t, b === 0 ? 0.26 : 0.16)
      if (b % 2 === 1) block(t)
    }
  }
}
// A little melody over the opening
const MEL = [[0, 72], [0.5, 76], [1, 79], [1.5, 76], [2, 77], [2.5, 76], [3, 74]]
MEL.forEach(([b, m]) => marimba(musicStart + 0.2 + b * BEAT, m, 0.13, 0.2, true))
duck(TL.s4.siren[0], TL.s4.siren[1], 0.35)

// ----- Effects on the cues -----
const { s1, s2, s3, s4, s5, s6, s7, s8 } = TL
slide(s1.drop, 1400, 300, s1.land - s1.drop, 0.12)
boing(s1.land, 180, 0.4)
run(s1.line1, [72, 76, 79], 0.08, 0.16)
run(s1.line2, [74, 77, 81, 84], 0.07, 0.15)
;[0, 1, 2].forEach((i) => pop(s1.wave + i * 0.22, 0.2, 900 + i * 150, 400))
slide(s2.open, 300, 900, 0.25, 0.1)
s2.items.forEach((t, i) => { run(t, [79 + i, 83 + i, 86 + i], 0.05, 0.08); boing(t + 0.7, 200 + i * 40, 0.3) })
clunk(s2.close)
pizz(s2.close + 0.35, 52, 0.18); pizz(s2.close + 0.55, 51, 0.18)
s3.beeps.forEach((t, i) => beep(t, i === 2 ? 1500 : 1200))
run(s3.zoom[0], [72, 74, 76, 79, 81, 84, 86, 88], 0.035, 0.12)
s4.wraps.forEach((w, i) => { pop(w, 0.3, 1000, 500); clunk(w + 0.52, 0.22); ding(w + 0.82, [76, 79, 81, 84][i], 0.2) })
for (let t = s4.sneak[0] + 0.5, i = 0; t < s4.sneak[1]; t += 0.14, i++) pizz(t, i % 2 ? 50 : 55, 0.14)
siren(s4.siren[0], s4.siren[1])
;[60, 63, 67].forEach((m) => honk(s4.nice, m, 0.32, 0.06))
slide(s4.unmask, 900, 200, 0.6, 0.12)
boing(s4.tray[1], 160, 0.3)
ding(s4.tray[1] + 0.3, 84, 0.12, 0.6)
for (let i = 0; i < 19; i++) coin(s5.coins[0] + ((s5.coins[1] - s5.coins[0]) * i) / 18 + 0.2, 84 + (i % 5))
clunk(s5.lid, 0.5)
coin(s5.bounce, 91); honk(s5.bounce + 0.1, 55, 0.3, 0.12); boing(s5.bounce + 0.45, 300, 0.15)
run(s6.fly[0], [67, 69, 72, 74, 76, 79, 81, 84], 0.09, 0.12)
;[0, 0.08, 0.16].forEach((d, i) => pop(s6.fly[1] + d, 0.25, 800 + i * 200, 400))
ding(s6.fly[1] + 0.25, 88, 0.12)
;[76, 79, 74, 81, 77].forEach((m, i) => bleep(s7.bubble + i * 0.11, m))
slide(s7.reach[0], 300, 700, s7.reach[1] - s7.reach[0], 0.08)
boing(s7.person, 240, 0.3)
honk(s7.ahem, 62, 0.16, 0.1); honk(s7.ahem + 0.2, 58, 0.24, 0.1)
slide(s7.retract[0], 700, 250, s7.retract[1] - s7.retract[0], 0.08)
;[72, 69].forEach((m, i) => bleep(s7.retract[1] + i * 0.14, m, 0.06))
clunk(s7.press, 0.3); ding(s7.press + 0.12, 84, 0.25, 1.2)
run(s7.press + 0.2, [72, 76, 79, 84, 88], 0.06, 0.16)
for (let i = 0; i < 10; i++) pop(s7.press + 0.2 + rnd() * 0.8, 0.12, 900 + rnd() * 900, 400)
'Vetted.'.split('').forEach((_, i) => marimba(s8.logo + i * 0.09, [72, 74, 76, 77, 79, 81, 84][i], 0.18))
ding(s8.tag, 84, 0.16, 1.2)
s8.stats.forEach((t, i) => pop(t, 0.25, 900 + i * 150, 400))
ding(s8.url, 88, 0.15, 1.2)
;[48, 55, 60, 64, 67, 72].forEach((m, i) => marimba(s8.url + 0.4 + i * 0.03, m, 0.12, (i - 2.5) * 0.15))
bass(s8.url + 0.4, 36, 2.5, 0.22)

// ----- Master: fade, normalise, gentle soft clip -----
const fadeIn = 0.3 * SR, fo0 = TL.fadeOut[0] * SR, fo1 = TL.fadeOut[1] * SR
let peak = 0
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / fadeIn) * (i < fo0 ? 1 : Math.max(0, 1 - (i - fo0) / (fo1 - fo0)))
  L[i] *= g; R[i] *= g
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
}
const norm = 0.9 / peak
const buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12)
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24)
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * norm * 1.1) * 32000), 44 + i * 4)
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * norm * 1.1) * 32000), 46 + i * 4)
}
const out = process.argv[2] || 'soundtrack.wav'
fs.writeFileSync(out, buf)
console.log(`wrote ${out}: ${TL.duration}s, peak before normalising ${peak.toFixed(2)}`)
