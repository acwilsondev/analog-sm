#!/usr/bin/env sh
set -eu

MINIO_ALIAS="${MINIO_ALIAS:-local}"

if [ -z "${S3_ENDPOINT:-}" ] || [ -z "${S3_ACCESS_KEY:-}" ] || [ -z "${S3_SECRET_KEY:-}" ] || [ -z "${S3_BUCKET:-}" ]; then
  echo "[minio-init] missing one of S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET"
  exit 1
fi

echo "[minio-init] configuring alias ${MINIO_ALIAS}"
mc alias set "${MINIO_ALIAS}" "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null

echo "[minio-init] ensuring bucket ${S3_BUCKET} exists"
mc mb --ignore-existing "${MINIO_ALIAS}/${S3_BUCKET}" >/dev/null

echo "[minio-init] bucket ready"
