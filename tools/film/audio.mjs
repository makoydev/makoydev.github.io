// Generates the film's soundtrack as a WAV file: a soft music bed plus sound effects
// placed on the cues in timeline.js. Everything is synthesised here, so there are no
// samples to licence. Usage: node audio.mjs out.wav
import fs from 'node:fs'
import './timeline.js'

const TL = globalThis.TL
const SR = 48000
const N = Math.ceil(TL.duration * SR)
const L = new Float32Array(N)
const R = new Float32Array(N)

// Seeded random numbers, so every build produces the same file.
let seed = 20261002
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)

function add(t0, dur, fn, gain = 1, pan = 0) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR)
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan)
  for (let i = 0; i < n; i++) {
    const k = s0 + i
    if (k < 0 || k >= N) continue
    const v = fn(i / SR, i)
    L[k] += v * gl
    R[k] += v * gr
  }
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d))
const noteHz = (m) => 440 * Math.pow(2, (m - 69) / 12)

// State-variable filter for noise sweeps.
function svf() {
  let low = 0, band = 0
  return (x, fc, q) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR)
    low += f * band
    const high = x - low - q * band
    band += f * high
    return { low, band, high }
  }
}

// ----- Sound effects -----
function whoosh(t, dur = 0.7, gain = 0.32, from = 300, to = 3200) {
  const f = svf()
  add(t, dur, (s) => {
    const k = s / dur
    const fc = from * Math.pow(to / from, k)
    return f(rnd() * 2 - 1, fc, 0.6).band * Math.sin(Math.PI * k) ** 1.5
  }, gain)
}
function pop(t, gain = 0.5, hi = 900, lo = 320) {
  let ph = 0
  add(t, 0.18, (s) => { const fr = lo + (hi - lo) * Math.exp(-s / 0.025); ph += (2 * Math.PI * fr) / SR; return Math.sin(ph) * env(s, 0.002, 0.05) }, gain)
}
function lock(t, gain = 0.35) {
  add(t, 0.12, (s) => (Math.sin(2 * Math.PI * 1760 * s) * 0.6 + Math.sin(2 * Math.PI * 2640 * s) * 0.4) * env(s, 0.001, 0.025), gain)
  add(t + 0.035, 0.15, (s) => Math.sin(2 * Math.PI * 660 * s) * env(s, 0.001, 0.04), gain * 0.8)
}
function glitch(t0, t1, gain = 0.16) {
  for (let t = t0; t < t1; t += 0.045) {
    const fr = 200 + rnd() * 2600, len = 0.02 + rnd() * 0.025, mix = rnd()
    add(t, len, (s) => (Math.sign(Math.sin(2 * Math.PI * fr * s)) * (1 - mix) + (rnd() * 2 - 1) * mix) * (1 - s / len), gain, rnd() * 1.2 - 0.6)
  }
}
function scanHum(t0, t1, gain = 0.2) {
  const dur = t1 - t0
  let ph1 = 0, ph2 = 0
  add(t0, dur, (s) => {
    const k = s / dur, fade = Math.min(1, s / 0.2, (dur - s) / 0.25)
    ph1 += (2 * Math.PI * 110) / SR
    ph2 += (2 * Math.PI * (380 + 520 * k)) / SR
    const saw = ((ph1 / Math.PI) % 2) - 1
    return (saw * 0.35 + Math.sin(ph2) * 0.4) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 9 * s)) * fade
  }, gain)
}
function bell(t, hz, gain = 0.25, decay = 1.1) {
  add(t, decay * 4, (s) => [1, 2.76, 5.4].reduce((a, m, i) => a + Math.sin(2 * Math.PI * hz * m * s) * [1, 0.4, 0.15][i] * Math.exp(-s / (decay / (i + 1))), 0) * Math.min(1, s / 0.003), gain)
}
function alert(t, gain = 0.28) {
  add(t, 0.22, (s) => Math.sin(2 * Math.PI * 880 * s) * env(s, 0.005, 0.07), gain)
  add(t + 0.16, 0.3, (s) => Math.sin(2 * Math.PI * 660 * s) * env(s, 0.005, 0.09), gain)
}
function tick(t, gain = 0.16, hz = 3000) { add(t, 0.03, (s) => Math.sin(2 * Math.PI * hz * s) * env(s, 0.0005, 0.006), gain) }
function thud(t, gain = 0.4) {
  let ph = 0
  add(t, 0.7, (s) => { ph += (2 * Math.PI * (40 + 50 * Math.exp(-s / 0.05))) / SR; return Math.sin(ph) * env(s, 0.002, 0.18) }, gain)
  const f = svf()
  add(t, 0.15, (s) => f(rnd() * 2 - 1, 900, 0.8).low * env(s, 0.001, 0.03), gain * 0.9)
}

// ----- Music bed: 96 BPM, Am - F - C - G, quiet under the effects -----
const BEAT = 60 / 96, BAR = BEAT * 4
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
function pad(t, notes, dur, gain) {
  notes.forEach((m, i) => {
    const hz = noteHz(m)
    add(t, dur + 1.2, (s) => {
      const e = Math.min(1, s / 0.6) * (s > dur ? Math.exp(-(s - dur) / 0.5) : 1)
      return (Math.sin(2 * Math.PI * hz * 0.998 * s) + 0.25 * Math.sin(2 * Math.PI * hz * 2.002 * s)) * e
    }, gain, i === 0 ? -0.3 : i === 2 ? 0.3 : 0)
  })
}
function kick(t, gain = 0.5) { let ph = 0; add(t, 0.4, (s) => { ph += (2 * Math.PI * (45 + 75 * Math.exp(-s / 0.03))) / SR; return Math.sin(ph) * env(s, 0.002, 0.12) }, gain) }
function hat(t, gain = 0.05) { let prev = 0; add(t, 0.06, (s) => { const x = rnd() * 2 - 1, y = x - prev; prev = x; return y * env(s, 0.0005, 0.015) }, gain) }
function bass(t, m, dur, gain = 0.08) { const hz = noteHz(m - 12); add(t, dur, (s) => Math.sin(2 * Math.PI * hz * s) * Math.min(1, s / 0.02) * Math.exp(-s / (dur * 0.8)), gain) }

const musicEnd = TL.end - 0.3
for (let bar = 0; bar * BAR < musicEnd; bar++) {
  const t = bar * BAR, ch = CHORDS[bar % 4]
  pad(t, ch, Math.min(BAR, musicEnd - t), 0.04)
  if (t >= TL.card - 0.2) bass(t, ch[0], BAR * 0.9)
  for (let b = 0; b < 4; b++) {
    const bt = t + b * BEAT
    if (bt >= musicEnd) break
    if (bt >= TL.card - 0.2) kick(bt, b === 0 ? 0.2 : 0.13)
    if (bt >= TL.rail) { hat(bt + BEAT / 2); if (bt >= TL.stations[1][0]) hat(bt + BEAT / 4, 0.025) }
  }
}
// Resolve on C major for the end card.
pad(TL.end, [48, 52, 55, 60], 3.8, 0.06)
bass(TL.end, 48, 3.5, 0.16)

// ----- Effects on the cues -----
whoosh(TL.title.a - 0.15, 0.8, 0.22)
whoosh(TL.title.b - 0.15, 0.8, 0.22, 500, 4000)
whoosh(TL.title.out, 0.6, 0.18, 3000, 300)
whoosh(TL.card - 0.1, 0.7, 0.2, 200, 1800)
TL.items.forEach((t, i) => { whoosh(t, 0.55, 0.14, 600, 2600); pop(t + 0.6, 0.45, 800 + i * 90) })
whoosh(TL.rail, 0.6, 0.18)
scanHum(TL.scan[0], TL.scan[1])
TL.stations.forEach(([, done], i) => { if (i !== 3) bell(done, noteHz(76 + [0, 2, 4, 5, 7, 9][i]), 0.12, 0.5) })
glitch(TL.secret[1], TL.secret[2]); lock(TL.secret[2])
TL.pii.forEach(([, a, z]) => { glitch(a, z, 0.12); lock(z, 0.3) })
alert(TL.trick[0]); pop(TL.trick[1], 0.35, 600, 400)
for (let t = TL.budget.count[0]; t < TL.budget.count[1]; t += 0.07) tick(t, 0.1, 2400)
for (let i = 0; i < 19; i++) tick(TL.budget.bars[0] + ((TL.budget.bars[1] - TL.budget.bars[0]) * i) / 18, 0.14, 1400 + i * 60)
whoosh(TL.split[0], 0.9, 0.24, 250, 2500)
whoosh(TL.fly[0], 1.1, 0.5, 200, 5000)
pop(TL.comment, 0.4, 700, 350)
pop(TL.decide, 0.3, 500, 300)
thud(TL.stamp)
bell(TL.end + 0.05, noteHz(72), 0.22, 1.4); bell(TL.end + 0.2, noteHz(76), 0.16, 1.4); bell(TL.end + 0.35, noteHz(79), 0.14, 1.6)
TL.stats.forEach((t, i) => pop(t, 0.32, 700 + i * 120))
bell(TL.url, noteHz(84), 0.14, 0.9)

// Master: fade in and out, normalise, gentle soft clip.
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
fs.writeFileSync(process.argv[2] || 'soundtrack.wav', buf)
console.log(`wrote ${process.argv[2] || 'soundtrack.wav'}: ${TL.duration}s, peak normalised from ${peak.toFixed(2)}`)
