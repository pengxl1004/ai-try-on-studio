#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the Next.js project (static export)..."
pnpm next build

echo "Build completed successfully!"
echo "Output directory: out/"
echo ""
echo "To run locally:"
echo "  Option 1: Open out/index.html directly in browser"
echo "  Option 2: Use a static server, e.g.:"
echo "    npx serve out -p 3000"
echo "    python3 -m http.server 3000 --directory out"
