// Generates the film's soundtrack as a WAV file: a 120 BPM track (kick, clap, hats, pumping
// bass, plucked arpeggio, pad) where every on-screen moment is a musical hit in key, placed on
// the beat by the cues in timeline.js. No samples, so nothing to licence.
// Usage: node audio.mjs out.wav
import fs from 'node:fs'
import './timeline.js'

const TL = globalThis.TL
const SR = 48000
const N = Math.ceil(TL.duration * SR)
const L = new Float32Array(N)
const R = new Float32Array(N)
const PUMP = new Float32Array(N).fill(1) // sidechain: music dips under each kick

let seed = 20261002
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)
const BEAT = 60 / TL.bpm, BAR = BEAT * 4

function add(t0, dur, fn, gain = 1, pan = 0, pumped = false) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR)
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan)
  for (let i = 0; i < n; i++) {
    const k = s0 + i
    if (k < 0 || k >= N) continue
    const v = fn(i / SR) * (pumped ? PUMP[k] : 1)
    L[k] += v * gl
    R[k] += v * gr
  }
}
// Saw-like tone whose upper harmonics fade faster: sounds like a filtered synth pluck.
function pluck(t, m, dur = 0.4, gain = 0.1, bright = 6, pan = 0, pumped = false) {
  const f = hz(m)
  add(t, dur + 0.05, (s) => {
    let v = 0
    for (let k = 1; k <= 10; k++) v += Math.sin(2 * Math.PI * f * k * s) / k * Math.exp(-s * k * bright)
    return v * Math.min(1, s / 0.003) * Math.exp(-s / (dur * 0.45))
  }, gain, pan, pumped)
}
function pad(t, notes, dur, gain = 0.03) {
  notes.forEach((m, i) => [0.997, 1.003].forEach((d, j) => {
    const f = hz(m) * d
    add(t, dur + 0.4, (s) => {
      let v = 0
      for (let k = 1; k <= 6; k++) v += Math.sin(2 * Math.PI * f * k * s) / (k * k)
      return v * Math.min(1, s / 0.25) * (s > dur ? Math.exp(-(s - dur) / 0.15) : 1)
    }, gain, (j ? 0.4 : -0.4) * (i % 2 ? 1 : -1), true)
  }))
}
function bell(t, m, gain = 0.18, decay = 0.8, pan = 0) {
  const f = hz(m)
  add(t, decay * 3, (s) => (Math.sin(2 * Math.PI * f * s) + 0.5 * Math.sin(2 * Math.PI * f * 2 * s) * Math.exp(-s / 0.2) + 0.25 * Math.sin(2 * Math.PI * f * 3 * s) * Math.exp(-s / 0.08)) * Math.exp(-s / decay) * Math.min(1, s / 0.002), gain, pan)
}
const kicks = []
function kick(t, gain = 0.55) {
  kicks.push(t)
  let ph = 0
  add(t, 0.35, (s) => { ph += (2 * Math.PI * (45 + 110 * Math.exp(-s / 0.03))) / SR; return Math.sin(ph) * Math.exp(-s / 0.11) + (s < 0.004 ? 0.4 * Math.sin(2 * Math.PI * 1800 * s) : 0) }, gain)
}
// Clap and hats use very short filtered noise, the way drum machines make them.
function clap(t, gain = 0.16) {
  let lo = 0, bp = 0
  add(t, 0.2, (s) => {
    const x = rnd() * 2 - 1, f = 0.35
    lo += f * bp; const hi = x - lo - 0.5 * bp; bp += f * hi
    const e = [0, 0.01, 0.02].reduce((a, o) => a + (s >= o ? Math.exp(-(s - o) / (o === 0.02 ? 0.06 : 0.008)) : 0), 0)
    return bp * e
  }, gain, 0.1)
}
function hat(t, gain = 0.045, open = false) { let prev = 0; add(t, open ? 0.15 : 0.05, (s) => { const x = rnd() * 2 - 1, y = x - prev; prev = x; return y * Math.exp(-s / (open ? 0.05 : 0.012)) }, gain, -0.2) }
function bass(t, m, gain = 0.2) {
  const f = hz(m)
  add(t, BEAT * 0.5, (s) => {
    let v = 0
    for (let k = 1; k <= 6; k++) v += Math.sin(2 * Math.PI * f * k * s) / k * Math.exp(-s * k * 9)
    return v * Math.min(1, s / 0.004) * Math.min(1, (BEAT * 0.5 - s) / 0.02)
  }, gain, 0, true)
}
function sub(t, gain = 0.5) { let ph = 0; add(t, 1.0, (s) => { ph += (2 * Math.PI * (36 + 30 * Math.exp(-s / 0.08))) / SR; return Math.sin(ph) * Math.exp(-s / 0.35) }, gain) }
// Tonal riser: a chord that climbs an octave and swells, leading into a hit.
function riser(t0, t1, notes, gain = 0.05) {
  const d = t1 - t0
  notes.forEach((m, i) => {
    let ph = 0
    add(t0, d, (s) => {
      const k = s / d
      ph += (2 * Math.PI * hz(m) * Math.pow(2, k)) / SR
      let v = 0
      for (let h = 1; h <= 5; h++) v += Math.sin(h * ph) / h
      return v * k * k * (0.8 + 0.2 * Math.sin(2 * Math.PI * (4 + 12 * k) * s))
    }, gain, (i - 1) * 0.4)
  })
}
const stab = (t, notes, gain = 0.09) => notes.forEach((m, i) => pluck(t, m, 0.35, gain, 3, (i - (notes.length - 1) / 2) * 0.3))

// ----- Arrangement -----
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] // Am F C G
const ROOTS = [33, 29, 36, 31]
const PENT = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84] // A minor pentatonic
const DROP = TL.card, END = TL.end
const silentDrums = (t) => (t >= TL.trick[0] - BEAT && t < TL.trick[0]) || (t >= TL.stamp - BEAT && t < TL.stamp) || (t >= END - BEAT && t < END)

// Kicks first, so the sidechain envelope exists before the pumped parts are added.
for (let b = 0; b * BEAT < TL.duration; b++) {
  const t = b * BEAT
  if (t >= DROP && t < TL.fadeOut[0] - 0.75 && !silentDrums(t)) kick(t, t >= END ? 0.4 : 0.55)
}
for (let i = 0; i < N; i++) PUMP[i] = 1
kicks.forEach((k) => { for (let i = Math.floor(k * SR); i < Math.min(N, (k + 0.3) * SR); i++) PUMP[i] = Math.min(PUMP[i], 1 - 0.65 * Math.exp(-(i / SR - k) / 0.09)) })

for (let bar = 0; bar * BAR < TL.duration; bar++) {
  const t0 = bar * BAR, ch = t0 >= END - BEAT ? [48, 52, 55, 59] : PROG[bar % 4], root = t0 >= END - BEAT ? 36 : ROOTS[bar % 4]
  pad(t0, ch.map((m) => m + 12), BAR, t0 < DROP ? 0.035 : 0.02)
  for (let s16 = 0; s16 < 16; s16++) {
    const t = t0 + (s16 * BEAT) / 4
    if (t >= TL.fadeOut[0]) break
    const note = ch[s16 % 3] + 12 + (s16 % 6 >= 3 ? 12 : 0)
    const arpGain = t < DROP ? 0.02 + 0.03 * (t / DROP) : t >= TL.scan[0] && t < TL.scan[1] ? 0.04 : 0.024
    pluck(t, note, 0.18, arpGain, t < DROP ? 9 : 5, s16 % 2 ? 0.35 : -0.35, true)
    if (t < DROP || silentDrums(t)) continue
    if (s16 % 4 === 2) { bass(t, root + 12); hat(t) } // off-beat bass and hats
    if (s16 % 8 === 4) clap(t)
    if (s16 % 2 === 1 && t >= TL.rail) hat(t, 0.02)
  }
}

// ----- Hits on the cues -----
riser(TL.title.out - 0.4, DROP, [57, 64, 69], 0.035)
stab(TL.title.a, [69, 72, 76], 0.07)
stab(TL.title.b, [72, 76, 79], 0.07)
sub(DROP, 0.45); stab(DROP, [57, 64, 69, 72], 0.08)
TL.items.forEach((s, i) => pluck(s + TL.fly, [69, 72, 74, 76, 79][i], 0.5, 0.16, 2.5))
bell(TL.scan[0], 81, 0.08, 0.6); bell(TL.scan[1], 88, 0.08, 0.6)
TL.stations.forEach(([, d], i) => { if (i !== 3) bell(d, [76, 79, 81, 84, 86, 88][i], 0.06, 0.4, 0.3) })
function scramble(a, b) { for (let t = a; t < b - 0.02; t += BEAT / 8) pluck(t, PENT[6 + Math.floor(rnd() * 6)], 0.08, 0.035, 8, rnd() - 0.5) }
scramble(TL.secret[1], TL.secret[2]); bell(TL.secret[2], 81, 0.22, 0.9); stab(TL.secret[2], [69, 76], 0.06)
TL.pii.forEach(([, a, b], i) => { scramble(a, b); bell(b, [84, 86, 88][i], 0.2, 0.8) })
stab(TL.trick[0], [58, 64, 70], 0.11); sub(TL.trick[0], 0.35) // a sour chord: something's wrong
pluck(TL.trick[1], 76, 0.3, 0.14, 2.5); pluck(TL.trick[1] + BEAT / 2, 72, 0.4, 0.14, 2.5) // "nice try"
for (let t = TL.budget.count[0]; t < TL.budget.count[1]; t += BEAT / 4) pluck(t, 93, 0.06, 0.03, 10)
for (let i = 0; i < 19; i++) pluck(TL.budget.bars[0] + ((TL.budget.bars[1] - TL.budget.bars[0]) * i) / 18, PENT[Math.min(11, Math.floor(i * 12 / 19))], 0.12, 0.07, 6)
sub(TL.split[0], 0.4); stab(TL.split[0], [53, 60, 65, 69], 0.08)
for (let i = 0; i < 8; i++) pluck(TL.plane[0] + i * BEAT / 4, PENT[4 + i], 0.25, 0.08, 4, (i / 7 - 0.5) * 0.8)
bell(TL.plane[1], 88, 0.12, 0.9)
bell(TL.comment, 76, 0.12, 0.7)
pluck(TL.decide, 72, 0.3, 0.1, 3)
riser(TL.stamp - 1.0, TL.stamp, [55, 62, 67], 0.03)
sub(TL.stamp, 0.6); stab(TL.stamp, [43, 55, 59, 62, 67], 0.1)
riser(END - 1.0, END, [60, 64, 67], 0.035)
sub(END, 0.55); stab(END, [48, 60, 64, 67, 72], 0.1)
;[72, 76, 79, 84, 88].forEach((m, i) => bell(END + 0.1 + i * 0.07, m, 0.07, 1.0, (i - 2) * 0.25))
TL.stats.forEach((t, i) => pluck(t, [76, 79, 84][i], 0.4, 0.13, 2.5))
bell(TL.url, 84, 0.14, 1.4)
pad(TL.fadeOut[0] - 1.25, [48, 55, 60, 64, 67], 2.0, 0.035)

// ----- Master: fade, normalise, gentle soft clip -----
const fo0 = TL.fadeOut[0] * SR, fo1 = TL.fadeOut[1] * SR
let peak = 0
for (let i = 0; i < N; i++) {
  const g = Math.min(1, i / (0.05 * SR)) * (i < fo0 ? 1 : Math.max(0, 1 - (i - fo0) / (fo1 - fo0)))
  L[i] *= g; R[i] *= g
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
}
const norm = 0.9 / peak
const buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12)
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24)
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * norm * 1.15) * 32000), 44 + i * 4)
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * norm * 1.15) * 32000), 46 + i * 4)
}
const out = process.argv[2] || 'soundtrack.wav'
fs.writeFileSync(out, buf)
console.log(`wrote ${out}: ${TL.duration}s, peak before normalising ${peak.toFixed(2)}`)
