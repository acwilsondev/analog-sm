# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Agent Instructions:** All AI agents must follow the core engineering and architectural standards defined in [AGENTS.md](AGENTS.md).

## Commands

```bash
# Development
npm run dev           # Start Next.js dev server
npm run build         # Production build
npm run lint          # ESLint

# Testing
npm test              # Run all Vitest tests
npx vitest run src/core/timeline.test.ts  # Run a single test file

# Database
npx prisma db push    # Apply schema changes (no migration history)
npx prisma db seed    # Seed with alice/bob/charlie (password: password123)
npx prisma studio     # Open Prisma GUI

# Docker (primary way to run the full stack)
docker compose up -d --build   # Build and start all services
docker compose logs -f app     # Tail app logs
./scripts/smoke-test.sh        # Full stack integration test (build → seed → curl checks)
```

## Infrastructure (Docker Compose)

Three services: `app` (Next.js), `postgres`, `minio`.

- DB schema is applied via `prisma db push` on container startup (see `entrypoint.sh`)
- MinIO bucket must be created manually before photo uploads work — the smoke test does not create the bucket
- Required env vars for `app`: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

## Done Standard

A change is not done until `./scripts/smoke-test.sh` passes and behavior is verified as per [AGENTS.md](AGENTS.md).
