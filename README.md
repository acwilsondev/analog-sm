# Analog Foundation (EPIC 0)

This repository now contains a deployable EPIC 0 foundation for Analog with explicit layer boundaries, Docker-based operations, and backup/restore workflows.

## First run (local)

```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

Create first admin (one-time bootstrap token):

```bash
npm run create-admin -- admin@example.com "$ADMIN_BOOTSTRAP_TOKEN"
```

## Scripts

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run format`
- `npm run backup`
- `npm run restore -- <backup-path>`
- `npm run backup:validate`

## Environment and secrets

- `.env.example` documents all required variables.
- `.env` is gitignored and never committed.
- Production should inject secrets via environment variables and/or Docker secrets.
- Rotate secret values by updating env/secrets and restarting affected services (`app`, `minio`, and any worker using the secret).

## Deployment

- Local/dev: `docker compose up`
- Production: `docker compose -f docker-compose.prod.yml up -d`

Both variants define durable volumes for Postgres + media and use restart policies.

## Health endpoints

- `GET /health` = liveness
- `GET /ready` = readiness (Postgres + storage)

Responses are intentionally minimal and non-sensitive.

## Migrations and safety

- Prisma migrations are versioned under `prisma/migrations`.
- Before release migrations: take and verify a backup.
- For destructive schema changes, restore-from-backup is the rollback strategy.

See `docs/ops.md` for operational runbook details.
