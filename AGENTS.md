# AGENTS.md

This document defines the architectural standards, engineering mandates, and "Done" criteria for all AI agents working on the Analog SM project.

---

## 1. Architecture: Functional Core, Imperative Shell

### Core Principles
- **The Functional Core (`src/core/`):** All business logic, data transformations, and state transitions must be written as **pure functions**.
    - **Purity:** Functions must take all dependencies as arguments and return a new value without modifying external state or performing I/O.
    - **Determinism:** Given the same input, the core must always produce the same output, making it trivial to unit test without mocks.
- **The Imperative Shell (`src/shell/`):** The outer layer (Next.js Server Actions, API routes, and database clients) handles all side effects.
    - **Responsibilities:** Fetching data, writing to the database, logging, and calling the pure functions of the core.
    - **Minimal Logic:** The shell should contain as little branching logic as possible, acting only as a coordinator.

### Refined Folder Structure
```text
src/
├── core/           # Pure logic (no Next.js, no I/O)
│   ├── types.ts    # Domain types and unions
│   ├── validation.ts # Zod/Valibot schemas
│   └── *.logic.ts  # Pure transformations
├── shell/          # Side Effects (Next.js, DB, S3)
│   ├── actions/    # Server Actions
│   ├── db/         # Prisma queries
│   └── media/      # S3/MinIO helpers
└── components/     # UI layer (View)
```

---

## 2. Engineering Standards

### TypeScript & Next.js
- **Type Safety:** Avoid `any`; use `unknown` and narrow with type guards. Use Zod for runtime validation.
- **Data Fetching:** Prefer Server Components for initial data. Use React Query for client-side state/optimistic updates.
- **Error Handling:** Use Next.js `error.tsx` and centralized `ActionResult<T>` for consistent API shapes.

### Granularity & Context Management
- **The 30-Line Rule:** Aim for functions under 30 lines. Extract logic into smaller, pure helpers.
- **The 150-Line Rule:** Evaluate if a logical submodule can be extracted once a file exceeds 150 lines.
- **Single Responsibility:** Each function must do **one** thing.
- **Refactoring Triggers:** If logic is nested more than 3 levels deep, extract it. If a shell function performs more than two distinct I/O operations, split it.

### Key Types
- **`ActionResult<T>`**: Standard return type for Server Actions:
  ```ts
  { success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string[]> }
  ```
- **`Post`**: A discriminated union (`TextPost | PhotoSetPost`) keyed on `type`.

---

## 3. Testing & Verification

### Testing Strategy
- **Functional Core Coverage:** Target 100% coverage for logic in `src/core/` using Vitest.
- **Integration/E2E:** Use Playwright for critical flows (Auth, Friends, Posting).
- **Database Testing:** Use dedicated test instances or containers.

### The "Done" Standard
A feature, architectural update, or bug fix is not considered **DONE** until:
1.  **Smoke Test:** Run `scripts/smoke-test.sh` to confirm the entire stack initializes and responds correctly.
2.  **Unit Tests:** Ensure all tests in `src/core/` pass.
3.  **Validation:** For bug fixes, verify the issue is resolved in a live containerized environment.
4.  **Documentation:** Update relevant `docs/*.md` files if system behavior changes.

## 4. Delimit Governance & Context

All agents MUST use Delimit to maintain session continuity and respect project governance. This ensures that work remains visible and recoverable across different models (Claude, Gemini, etc.).

### Session Lifecycle (Mandatory)
- **Start of Session (Read):**
    - Call `delimit_revive` to recover context from previous sessions.
    - Call `delimit_ledger_context` to identify high-priority tasks and recent activity.
    - Call `delimit_gov_health` to verify if the project environment is healthy and initialized.
- **End of Session (Write):**
    - Call `delimit_soul_capture` and `delimit_session_handoff` to preserve state for the next agent.
    - Document all key decisions, blockers, and files changed in the handoff.

### Task Management (Read/Write)
- **Read:** Use `delimit_ledger_list` or `delimit_ledger_query` to understand the current project backlog.
- **Write:** 
    - Use `delimit_ledger_done` immediately after completing a task.
    - Use `delimit_ledger_add` for any new bugs, tasks, or strategies identified during the session.

### Governance Gates
- **Pre-Commit:** Call `delimit_repo_diagnose` before proposing a git commit.
- **UI Changes:** Call `delimit_design_validate_responsive` after CSS/UI edits.
- **API Changes:** Call `delimit_lint` and `delimit_drift_check` after editing `docs/openapi.yaml`.

---

## 5. Committing
- **Small Commits:** Keep commits focused on a single theme.
- **Conventional Commits:** Use `feat(scope):`, `fix(scope):`, `refactor(scope):`, etc.
