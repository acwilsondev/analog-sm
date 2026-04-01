#!/usr/bin/env bash
set -euo pipefail

echo "[validate] starting clean stack"
docker compose down -v || true
docker compose up -d

echo "[validate] waiting for readiness"
until curl -fsS http://localhost:3000/ready >/dev/null; do sleep 2; done

echo "[validate] seeding data"
# 1. Create admin
npm run create-admin -- test@example.com replace-with-long-random-token

# 2. Seed media
MC_ALIAS="validate"
mc alias set "${MC_ALIAS}" "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null
echo "test media content" > /tmp/validate-file.txt
mc cp /tmp/validate-file.txt "${MC_ALIAS}/${S3_BUCKET}/test-file.txt"

echo "[validate] running backup"
BACKUP_ROOT="${BACKUP_ROOT:-./backups}" npm run backup
LATEST_BACKUP="$(ls -dt ${BACKUP_ROOT:-./backups}/backup-* | head -n 1)"

echo "[validate] resetting volumes"
docker compose down -v
docker compose up -d
until curl -fsS http://localhost:3000/ready >/dev/null; do sleep 2; done

echo "[validate] restoring"
npm run restore -- "${LATEST_BACKUP}"

echo "[validate] verification"
curl -fsS http://localhost:3000/ready >/dev/null

# Verify admin
MEMBER_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT count(*) FROM \"User\" WHERE email = 'test@example.com';")
if [[ "${MEMBER_COUNT}" -ne 1 ]]; then
  echo "FAIL: member count mismatch (got ${MEMBER_COUNT}, expected 1)"
  exit 1
fi

# Verify media
mc ls "${MC_ALIAS}/${S3_BUCKET}/test-file.txt" >/dev/null
if [[ $? -ne 0 ]]; then
  echo "FAIL: media file missing after restore"
  exit 1
fi

echo "PASS: backup/restore dry-run completed and verified"
