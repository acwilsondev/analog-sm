# Architecture Overview

Analog is built with a strictly layered architecture to ensure domain integrity, data durability, and ease of testing.

## Layer Boundaries

The project enforces the following layer dependencies:

1.  **Domain Layer** (`src/domain/`): 
    - The core of the application.
    - Contains entities (`entities.ts`) and business invariants (`invariants.ts`).
    - **Rule**: Must not import from any other layer. It is a "pure" layer with zero dependencies on infrastructure or frameworks.
2.  **Infrastructure Layer** (`src/infra/`):
    - Implementation of external concerns: Database (Prisma), Storage (S3/MinIO), Auth (Auth.js), and Config.
    - **Rule**: Can import from Domain, but not from the Application layer.
3.  **Application Layer** (`src/app/`):
    - Contains the "Write Path" (Commands) and "Read Path" (Queries).
    - Orchestrates domain logic and infrastructure.
    - **Rule**: Can import from Domain and Infra.
4.  **Interface Layer** (`src/ui/`):
    - Presentation logic (currently minimal/headless).
    - **Rule**: Must only import from the Application API contracts.

## Command-Query Separation (CQS)

To maintain a predictable and auditable state, all operations are split into Commands and Queries.

### Write Path (Commands)
Location: `src/app/commands/`

- **Purpose**: Any operation that changes state (e.g., `CreateEntry`, `ToggleLike`).
- **Audit**: Every command is automatically or explicitly logged to the `AuditLog` table.
- **Validation**: Commands are responsible for enforcing domain invariants before committing to the database.
- **Transactions**: Commands use database transactions to ensure atomicity.

### Read Path (Queries)
Location: `src/app/queries/`

- **Purpose**: Optimized data retrieval for specific views (e.g., `GetTimeline`, `SearchEntries`).
- **Optimization**: Queries use specialized projections to return exactly what the UI needs, minimizing over-fetching.
- **Strictness**: Queries are read-only and MUST NOT modify any state.

## Data Durability

Analog follows an **Archive-First** design:
- **Immutability**: Revisions and Media records are immutable. Corrections create new revisions rather than overwriting old ones.
- **Soft Deletes**: Users "tombstone" entries to hide them from feeds, but the raw data remains in the archive for long-term preservation.
- **Integrity**: Media files are tracked with SHA-256 checksums to detect bit rot or storage failure.
