#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: bash scripts/exec-in-app.sh <command> [args...]"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run this command from the host CLI."
  exit 1
fi

if ! docker compose ps --status running --services 2>/dev/null | grep -qx 'app'; then
  echo "The app service is not running. Start it first with: docker compose up -d app"
  exit 1
fi

docker compose exec -T app "$@"
