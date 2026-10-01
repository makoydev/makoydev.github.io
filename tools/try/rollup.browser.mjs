import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { readFileSync } from 'node:fs'

const notice = (title, path) => `${title}\n${readFileSync(path, 'utf8').trim()}`
const banner = `/*!
 * Vetted v0.1.0 detection engine for the browser (commit 2ae958e).
 * Source: https://github.com/makoydev/vetted/tree/v0.1.0 (Apache-2.0, Copyright 2026 Michael Mendoza).
 * Includes:
 *  - gitleaks v8.30.1 default rules (vendored as JSON)
 *  - sg-pii-rules v0.1.0 detectors (Apache-2.0, Copyright 2026 Michael Mendoza)
 *  - re2js 2.8.6 and picomatch 4.0.7
 * Third-party licence notices follow.
 *
${[
  notice('gitleaks (https://github.com/gitleaks/gitleaks):', 'vendor/gitleaks/LICENSE'),
  notice('re2js (https://github.com/le0pard/re2js):', 'node_modules/re2js/LICENSE'),
  notice('picomatch (https://github.com/micromatch/picomatch):', 'node_modules/picomatch/LICENSE')
].join('\n\n').split('\n').map((l) => ' * ' + l).join('\n')}
 */`

export default {
  input: 'src/browser-entry.ts',
  output: {
    file: 'build/vetted-engine.js',
    format: 'iife',
    name: 'VettedEngine',
    banner,
    // Node's Buffer, used only for byte lengths, provided inside the bundle's scope.
    intro: 'var Buffer = { byteLength: function (s) { return new TextEncoder().encode(String(s)).length } };',
    generatedCode: 'es2015'
  },
  plugins: [
    typescript({ tsconfig: './tsconfig.json', compilerOptions: { outDir: 'build', declaration: false, sourceMap: false } }),
    json(),
    nodeResolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    terser({ format: { comments: /^!/ } })
  ]
}
