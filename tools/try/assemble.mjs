// Inlines the engine and page script into the template and writes a strict
// Content-Security-Policy with the SHA-256 of each inline script.
// Usage: node assemble.mjs <template> <engine.js> <out.html> <tag> <commit>
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const [template, enginePath, out, tag, commit] = process.argv.slice(2)
const engine = readFileSync(enginePath, 'utf8').replace(/<\/script/gi, '<\\/script')
let html = readFileSync(template, 'utf8')
  .replace('/*@ENGINE@*/', () => engine)
  .replaceAll('@ENGINE_TAG@', tag)
  .replaceAll('@ENGINE_COMMIT@', commit.slice(0, 7))

const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
  ([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`
)
if (hashes.length !== 2) throw new Error(`expected 2 inline scripts, found ${hashes.length}`)
const csp = [
  "default-src 'none'",
  `script-src ${hashes.join(' ')}`,
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  'img-src data:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'"
].join('; ')
html = html.replace('@CSP@', csp)
writeFileSync(out, html)
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB), engine ${tag} @ ${commit.slice(0, 7)}`)
console.log(`script hashes: ${hashes.join(' ')}`)
