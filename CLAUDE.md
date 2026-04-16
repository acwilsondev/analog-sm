# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture

This app follows a strict **Functional Core / Imperative Shell** pattern:

```
src/
├── core/       # Pure functions only — no I/O, no Next.js imports
├── shell/      # All side effects: DB (Prisma), Server Actions, S3, NextAuth config
├── components/ # Client components ("use client")
└── app/        # Next.js App Router pages and API routes
```

**Core (`src/core/`)** — Pure, deterministic functions. No mocks needed in tests. Examples: `sortPostsTemporally`, `canSendFriendRequest`, `transitionFriendship`. All new business logic goes here first.

**Shell (`src/shell/`)** has three sub-layers:
- `shell/db/` — Prisma queries that map DB records to `core/types.ts` domain types
- `shell/actions/` — Next.js Server Actions (`'use server'`). Each calls core logic + performs I/O. All return `ActionResult<T>` (defined in `core/types.ts`).
- `shell/media/s3.ts` — MinIO/S3 upload helper
- `shell/auth.ts` — NextAuth `authOptions` (credentials provider, JWT sessions, user.id injected into session via callback)

**Data flow for a mutation:** Page/component → Server Action (`shell/actions/`) → validate with Zod (`core/validation.ts`) → call pure core function → DB write (`shell/db/`) → `revalidatePath()`

## Key Types

`ActionResult<T>` (`src/core/types.ts`) — standard return type for all Server Actions:
```ts
{ success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

`Post` is a discriminated union: `TextPost | PhotoSetPost` keyed on `type`.

## Infrastructure (Docker Compose)

Three services: `app` (Next.js), `postgres`, `minio`.

- DB schema is applied via `prisma db push` on container startup (see `entrypoint.sh`)
- MinIO bucket must be created manually before photo uploads work — the smoke test does not create the bucket
- Required env vars for `app`: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

## Done Standard

A change is not done until `./scripts/smoke-test.sh` passes (boots full stack, pushes schema, seeds DB, checks HTTP 200 on `/`, `/search`, `/profile/alice`, `/friends`).
