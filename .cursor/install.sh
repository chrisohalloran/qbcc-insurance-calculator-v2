#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f pnpm-lock.yaml ]]; then
  corepack enable
  pnpm install --frozen-lockfile
  VERIFY_CMD=(pnpm exec tsc --noEmit)
elif [[ -f yarn.lock ]]; then
  corepack enable
  yarn install --frozen-lockfile
  VERIFY_CMD=(yarn exec tsc --noEmit)
elif [[ -f package-lock.json ]]; then
  npm ci
  VERIFY_CMD=(npx tsc --noEmit)
else
  npm install
  VERIFY_CMD=(npx tsc --noEmit)
fi

echo "Running lightweight typecheck..."
"${VERIFY_CMD[@]}"
