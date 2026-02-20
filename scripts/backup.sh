#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-./backups}"
TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${BACKUP_ROOT}/backup-${TS}"
MEDIA_ALIAS="${MINIO_ALIAS:-local}"

mkdir -p "${OUT_DIR}"

echo "[backup] exporting postgres dump"
pg_dump "${DATABASE_URL}" > "${OUT_DIR}/database.sql"

echo "[backup] exporting media bucket"
mc alias set "${MEDIA_ALIAS}" "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null
mc cp --recursive "${MEDIA_ALIAS}/${S3_BUCKET}" "${OUT_DIR}/media"

echo "[backup] writing metadata"
cat > "${OUT_DIR}/metadata.json" <<META
{
  "instanceName": "${INSTANCE_NAME}",
  "brandingName": "${BRANDING_NAME}",
  "createdAt": "${TS}",
  "version": "$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
}
META

if command -v sha256sum >/dev/null 2>&1; then
  (cd "${OUT_DIR}" && find media -type f -print0 | sort -z | xargs -0 sha256sum > checksums.sha256)
fi

echo "[backup] completed: ${OUT_DIR}"
