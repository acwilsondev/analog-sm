#!/usr/bin/env bash
set -euo pipefail

echo "[validate] starting clean stack"
docker compose down -v || true
docker compose up -d

echo "[validate] waiting for readiness"
until curl -fsS http://localhost:3000/ready >/dev/null; do sleep 2; done

echo "[validate] running backup"
BACKUP_ROOT="${BACKUP_ROOT:-./backups}" npm run backup
LATEST_BACKUP="$(ls -dt ${BACKUP_ROOT:-./backups}/backup-* | head -n 1)"

echo "[validate] resetting volumes"
docker compose down -v
docker compose up -d
until curl -fsS http://localhost:3000/ready >/dev/null; do sleep 2; done

echo "[validate] restoring"
npm run restore -- "${LATEST_BACKUP}"

echo "[validate] basic verification"
curl -fsS http://localhost:3000/ready >/dev/null

echo "PASS: backup/restore dry-run completed"
