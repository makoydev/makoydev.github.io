// Renders film.html frame by frame in headless Chrome and muxes it with the soundtrack.
// Usage: node render.mjs <soundtrack.wav> <out.mp4> [path to Chrome]
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import './timeline.js'

const TL = globalThis.TL
const [wav, out, chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'] = process.argv.slice(2)
const here = path.dirname(fileURLToPath(import.meta.url))

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files'] })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
await page.goto('file://' + path.join(here, 'film.html'), { waitUntil: 'networkidle0' })
await page.evaluate(() => document.fonts.ready.then(() => window.filmReady()))

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'png', '-i', '-', '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] })
const done = new Promise((resolve, reject) => ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg exited with ' + code)))))

const frames = Math.round(TL.duration * TL.fps)
for (let f = 0; f < frames; f++) {
  await page.evaluate((n) => window.seek(n), f)
  const png = await page.screenshot({ type: 'png' })
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
  if (f % 150 === 0) console.log(`frame ${f}/${frames}`)
}
ff.stdin.end()
await done
await browser.close()
console.log(`wrote ${out}`)
