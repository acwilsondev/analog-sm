# Operations Runbook v1

## Initial setup

1. `cp .env.example .env`
2. Fill production secrets and instance name.
3. `docker compose -f docker-compose.prod.yml up --build -d`
4. Confirm bucket init job finished: `docker compose -f docker-compose.prod.yml logs minio-init`
5. `curl -fsS http://localhost:3000/ready`

Expected output: `minio-init` logs contain `bucket ready`, and `/ready` returns HTTP 200 with `{ "status": "ready" }`.

## Upgrade procedure

1. Pull updated repository.
2. Run backup: `npm run backup`.
3. Deploy migrations: `npm run db:migrate`.
4. Restart: `docker compose -f docker-compose.prod.yml up --build -d`.
5. Verify: `curl -fsS http://localhost:3000/ready`.

## Backup schedule recommendation

- Run `npm run backup` at least daily.
- Store backup artifacts off-host.
- Keep at least one known-good weekly restore checkpoint.

## Restore procedure

1. Start clean volumes/environment.
2. `docker compose -f docker-compose.prod.yml up -d`
3. `npm run restore -- <backup-path>`
4. Verify `curl -fsS http://localhost:3000/ready`

No manual SQL commands are required.

## Logs

- App: `docker compose logs app`
- Postgres: `docker compose logs postgres`
- MinIO: `docker compose logs minio`

## What to do if X is down

- `/health` failing: app process is unhealthy. Restart app container and inspect app logs.
- `/ready` failing with DB issue: verify postgres container health and credentials.
- `/ready` failing with storage issue: verify minio health and S3 credentials, then rerun bucket init with `docker compose -f docker-compose.prod.yml run --rm minio-init`.
- Restore needed: run restore workflow against clean volumes.
