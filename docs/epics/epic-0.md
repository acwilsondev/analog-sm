# EPIC 0 — Foundation & Operability (User Stories)

> “Can this run, be upgraded, and be recovered?”
>
> **Goal:** A deployable, backup-safe instance.

---

## Story 0.1 — Repo scaffold with enforced boundaries

**As a** contributor  
**I want** a project structure that enforces domain/infra/app/ui boundaries  
**So that** logic stays composable, testable, and CQRS-friendly.

### Story 0.1 Acceptance Criteria

- Repo contains `src/domain`, `src/infra`, `src/app`, `src/ui` (or equivalent).
- Lint rules / TS config prevent forbidden imports (e.g., UI importing infra directly).
- Each top-level directory has a short README describing ownership/non-goals.
- Base scripts exist: `lint`, `typecheck`, `test`, `format`.

---

## Story 0.2 — Local-first dev environment (single command)

**As a** developer  
**I want** to start the full stack locally with one command  
**So that** onboarding is fast and consistent.

### Story 0.2 Acceptance Criteria

- `docker compose up` starts: app, postgres, storage (MinIO or local).
- App boots with a known dev config (no manual DB setup).
- A “first run” doc exists in `README.md` with exact commands.
- Health endpoints confirm readiness.

---

## Story 0.3 — Production deployment via Docker Compose

**As an** admin  
**I want** a production-ready compose setup  
**So that** I can deploy an instance quickly and predictably.

### Story 0.3 Acceptance Criteria

- `docker-compose.prod.yml` (or profiles) supports reverse-proxy-friendly networking.
- Volumes are declared for Postgres and media storage.
- Restart policies are set.
- Environment variables are documented (with safe defaults where possible).
- Instance name / branding values can be configured via env.

---

## Story 0.4 — Environment configuration & validation

**As a** developer/admin  
**I want** configuration to be explicit and validated at startup  
**So that** misconfigurations fail fast.

### Story 0.4 Acceptance Criteria

- `.env.example` exists and matches code expectations.
- Runtime config validation (e.g., Zod) checks required vars and formats.
- Startup logs clearly identify missing/invalid config.
- No secrets committed; `.env` is gitignored.

---

## Story 0.5 — Secrets management pattern

**As an** admin  
**I want** a clear secrets strategy  
**So that** deployments don’t leak credentials.

### Story 0.5 Acceptance Criteria

- Documented approach: env vars + Docker secrets (optional but described).
- Separate dev vs prod patterns in docs.
- All secret values referenced only via env/secrets (no hardcoding).
- Rotating secrets is documented (what breaks, what to restart).

---

## Story 0.6 — Service health checks & readiness

**As an** admin  
**I want** health checks for the app and dependencies  
**So that** I can detect failures and automate restarts.

### Story 0.6 Acceptance Criteria

- App exposes:
  - `/health` (liveness)
  - `/ready` (readiness: db + storage reachable)
- Docker healthcheck uses `/ready`.
- Health endpoints do not leak sensitive info.

---

## Story 0.7 — Database migrations are versioned and reversible

**As a** developer  
**I want** migrations to be controlled and reviewable  
**So that** upgrades don’t risk data loss.

### Story 0.7 Acceptance Criteria

- Migration tool selected (Prisma Migrate or equivalent).
- Migrations are committed, ordered, and reproducible.
- Rollback strategy documented:
  - either reversible migrations, or
  - explicit “restore from backup” workflow for destructive changes
- A pre-release checklist includes “backup before migrate”.

---

## Story 0.8 — Admin bootstrap user on first run

**As an** admin  
**I want** a secure way to create the first admin  
**So that** the instance is operable without manual DB edits.

### Story 0.8 Acceptance Criteria

- First-run flow exists:
  - either CLI `create-admin`, or
  - one-time bootstrap token env var enabling an admin-creation page
- Bootstrap mechanism is disabled after completion.
- Admin can create invites once logged in.

---

## Story 0.9 — Backup script (DB + media) with integrity checks

**As an** admin  
**I want** a single command to back up the instance  
**So that** recovery is reliable.

### Story 0.9 Acceptance Criteria

- `backup` produces an artifact (directory or tarball) containing:
  - Postgres dump
  - media bucket/files
  - config metadata (non-secret)
  - version info
- Backups include checksums for media (or at least a manifest).
- Backup location is configurable.
- Backup is idempotent and logs what it did.

---

## Story 0.10 — Restore script (DB + media) to a clean instance

**As an** admin  
**I want** to restore from a backup artifact  
**So that** I can recover from failure or migrate servers.

### Story 0.10 Acceptance Criteria

- `restore` can restore onto a clean environment (fresh volumes).
- Restore verifies:
  - db import succeeded
  - media present
  - app boots and `/ready` passes
- Restore process is documented with exact commands.
- Restore does not require manual SQL steps.

---

## Story 0.11 — Backup/restore dry-run validation

**As a** developer/admin  
**I want** an automated validation step  
**So that** I can trust backups before disaster.

### Story 0.11 Acceptance Criteria

- A script or CI job can:
  - start clean stack
  - seed minimal data
  - run backup
  - tear down
  - restore into clean stack
  - verify counts (entries/media/users) match
- Produces a clear pass/fail output.

---

## Story 0.12 — Operational README (runbook v1)

**As an** admin  
**I want** a short runbook  
**So that** I can operate the instance without tribal knowledge.

### Story 0.12 Acceptance Criteria

- `docs/ops.md` (or similar) includes:
  - initial setup
  - upgrade procedure
  - backup schedule recommendation
  - restore procedure
  - log locations
  - “what to do if X is down”
- Includes concrete commands and expected outputs.

---

## Exit Criteria Checklist (EPIC 0)

- [ ] Fresh instance → usable in <30 minutes
- [ ] Backup → restore → identical state
- [ ] Migrations are reversible *or* destructive changes require restore workflow
- [ ] Health checks exist and are meaningful
- [ ] Admin bootstrap is secure and one-time
- [ ] Ops docs exist and are copy/paste runnable
