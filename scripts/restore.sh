#!/usr/bin/env bash
set -euo pipefail

BACKUP_PATH="${1:-}"
if [[ -z "${BACKUP_PATH}" ]]; then
  echo "Usage: BACKUP_ROOT=./backups npm run restore -- <backup-path>"
  exit 1
fi

if [[ ! -d "${BACKUP_PATH}" ]]; then
  echo "Backup path not found: ${BACKUP_PATH}"
  exit 1
fi

MEDIA_ALIAS="${MINIO_ALIAS:-local}"

echo "[restore] importing postgres"
psql "${DATABASE_URL}" < "${BACKUP_PATH}/database.sql"

echo "[restore] restoring media"
mc alias set "${MEDIA_ALIAS}" "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null
mc rm --recursive --force "${MEDIA_ALIAS}/${S3_BUCKET}" || true
mc mb "${MEDIA_ALIAS}/${S3_BUCKET}" || true
mc cp --recursive "${BACKUP_PATH}/media/${S3_BUCKET}" "${MEDIA_ALIAS}/"

if [[ -f "${BACKUP_PATH}/checksums.sha256" ]] && command -v sha256sum >/dev/null 2>&1; then
  echo "[restore] verifying media checksums"
  (cd "${BACKUP_PATH}" && sha256sum -c checksums.sha256)
fi

echo "[restore] checking readiness"
curl -fsS "http://localhost:${PORT:-3000}/ready" >/dev/null

echo "[restore] completed"
