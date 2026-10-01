#!/usr/bin/env bash
# Builds vetted/try/index.html: the "Try Vetted" showcase.
#
# 1. Clones Vetted at a release tag and bundles its real detection code
#    (gitleaks rules, sg-pii-rules, injection rules, the pipeline) into a
#    browser engine with tools/try/rollup.browser.mjs.
# 2. Inlines the engine and the page script into tools/try/template.html,
#    and writes a Content-Security-Policy that allows only those two
#    scripts and blocks every network connection (connect-src 'none').
#
# Usage: tools/try/build.sh [tag]   (default: v0.1.0). Needs git, Node 24, npm.
set -euo pipefail
TAG="${1:-v0.1.0}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK:?}"' EXIT

git clone -q --depth 1 --branch "$TAG" https://github.com/makoydev/vetted.git "$WORK/vetted"
cd "$WORK/vetted"
npm ci --silent
npm install --no-save -E @rollup/plugin-terser@0.4.4 --silent
cp "$HERE/browser-entry.ts" src/browser-entry.ts
cp "$HERE/rollup.browser.mjs" rollup.browser.mjs
npx rollup --config rollup.browser.mjs --silent
COMMIT="$(git rev-parse HEAD)"

node "$HERE/assemble.mjs" "$HERE/template.html" "$WORK/vetted/build/vetted-engine.js" "$ROOT/vetted/try/index.html" "$TAG" "$COMMIT"
