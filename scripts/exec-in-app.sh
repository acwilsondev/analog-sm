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

if docker compose exec -T app true >/dev/null 2>&1; then
  docker compose exec -T app "$@"
  exit 0
fi

APP_CONTAINER_ID="$(docker ps --filter label=com.docker.compose.service=app --format '{{.ID}}' | head -n 1)"

if [[ -z "${APP_CONTAINER_ID}" ]]; then
  echo "Could not find a running app container. Start it first with: docker compose up -d app"
  exit 1
fi

docker exec -i "${APP_CONTAINER_ID}" "$@"
