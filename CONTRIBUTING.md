# Contributing to Analog SM

Welcome! This document outlines the technical standards and setup for developers working on Analog SM.

---

## 🏗 Architecture: Functional Core, Imperative Shell

Analog SM follows a strict architectural pattern to ensure testability and long-term maintainability:

- **Functional Core (`src/core/`):** Contains all business logic, data transformations, and state transitions. These are **pure functions**—they take all dependencies as arguments, return new values, and perform no I/O.
- **Imperative Shell (`src/shell/`):** Handles side effects such as database queries (Prisma), file storage (S3/MinIO), logging, and Next.js Server Actions. It acts only as a coordinator for the functional core.

### Engineering Mandates

- **The 30/150-Rule:** Functions should aim for <30 lines; files should aim for <150 lines.
- **Type Safety:** Strict TypeScript usage with Zod for runtime validation.
- **Discriminated Unions:** Domain models like `Post` are represented as unions for type safety.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Auth:** [NextAuth.js](https://next-auth.js.org/) (Auth.js)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Storage:** S3-compatible storage (MinIO for local development)
- **Testing:** [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## 🚦 Local Development Setup

### 1. Prerequisites

- Node.js (v20+)
- Docker & Docker Compose

### 2. Infrastructure

Start the required services (Postgres and MinIO) using Docker:

```bash
docker-compose up -d postgres minio
```

### 3. Application Setup

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run migrations and seed the database
npx prisma migrate dev
npm run seed

# Start the development server
npm run dev
```

---

## 🧪 Testing & Quality

We prioritize high test coverage for the **Functional Core**.

- **Unit Tests:** `npm test`
- **Smoke Test:** `bash scripts/smoke-test.sh` (Verifies the entire stack initializes correctly)
- **Linting:** `npm run lint`

---

## 📜 Standards & Governance

All developers must adhere to the standards defined in:

- [AGENTS.md](AGENTS.md) - Full architectural and engineering mandates.
- [GEMINI.md](GEMINI.md) - Best practices for Next.js and Full Stack development.
- [docs/](docs/) - API specifications and roadmap.

---

## 🚀 Deployment

Analog SM is designed to be deployed via Docker. Ensure `DATABASE_URL` and S3 credentials are correctly configured in your production environment.
