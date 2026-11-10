#!/usr/bin/env bash
# Usage : ./make_episode.sh episode.json [--test]
set -euo pipefail
cd "$(dirname "$0")"
EP="$(realpath "${1:?Usage: ./make_episode.sh episode.json [--test]}")"
NAME="$(basename "$EP" .json)"
[ -f .env ] && set -a && . ./.env && set +a
[ -d node_modules ] || npm install --no-audit --no-fund

EXTRA=()
if [ "${2:-}" = "--test" ]; then
  export QUIZ_LIMIT=2; NAME="${NAME}_test"
  EXTRA=(--scale=0.5 --frames=0-120)
fi

echo "== 1/4 Voix";      node scripts/voice.js "$EP"
echo "== 2/4 Montage";   node scripts/timeline.js "$EP"
echo "== 3/4 Rendu";     npx remotion render src/index.ts Quiz build/raw.mp4 \
  --props=build/props.json --public-dir=build/public --concurrency=2 \
  --codec=h264 --audio-codec=aac ${CHROME_PATH:+--browser-executable="$CHROME_PATH"} "${EXTRA[@]}"
echo "== 4/4 Mixage";    mkdir -p out; node scripts/mix.js build/raw.mp4 "out/${NAME}.mp4"
echo "OK -> out/${NAME}.mp4"
