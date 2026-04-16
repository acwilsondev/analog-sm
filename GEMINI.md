# GEMINI.md (Full Stack Application)

This document outlines the best practices, testing strategies, and architectural standards for the Next.js and TypeScript full stack project.

---

## 1. TypeScript & Next.js Best Practices

### Code Style & Quality
* **Formatting & Linting:** Use **Prettier** for formatting and **ESLint** with the `next/core-web-vitals` and `@typescript-eslint/recommended` configs.
* **Type Safety:** * Avoid the `any` type at all costs; use `unknown` if the type is truly dynamic and narrow it using type guards.
    * Use **Zod** or **Valibot** for runtime schema validation, especially for API responses and form inputs.
    * Leverage `interface` for public API definitions and `type` for unions or intersections.
* **Data Fetching:** * Prefer **Server Components** for initial data fetching to reduce client-side JavaScript.
    * Use **React Query (Tanstack Query)** for client-side state management, caching, and optimistic updates.
* **Error Handling:**
    * Use Next.js `error.tsx` boundaries for UI-level crashes.
    * Implement a centralized `ApiResponse` type for backend routes to ensure consistent error shapes (e.g., `{ success: boolean, data?: T, error?: string }`).

### Architecture
* **App Router Structure:** Follow the Next.js App Router convention. Keep business logic in a `services/` or `lib/` directory, separate from the `app/` routing layer.
* **Server Actions:** Use Server Actions for mutations. Ensure all actions are protected by a validation layer and authentication check.
* **Component Composition:** Favor small, reusable components. Use the **Shadcn/UI** pattern (headless components + Tailwind CSS) for UI consistency.

---

## 2. Testing Strategy

### Unit & Integration Testing
* **Vitest:** Use Vitest for unit testing utility functions and business logic.
* **React Testing Library:** Test UI components by behavior (what the user sees) rather than implementation details.
* **Target:** Maintain at least **80% coverage** on critical business logic and utility helpers.

### End-to-End (E2E) Testing
* **Playwright:** Use Playwright for critical user flows (Authentication, Checkout, Onboarding).
* Run E2E tests against a staging-like environment in the CI/CD pipeline.

### Database Testing
* Use a dedicated test database or a containerized instance (e.g., via **Testcontainers**) to ensure migrations and queries work as expected without polluting production data.

---

## 3. Documentation Standards

### Code Documentation
* **TSDoc:** Use TSDoc comments (`/** ... */`) for exported functions, especially for complex hooks or utility libraries.
* **Self-Documenting Code:** Prioritize expressive naming over excessive commenting. If a function needs a long comment to explain *what* it does, consider refactoring.

### API Documentation
* If the application exposes a public API, maintain an **OpenAPI/Swagger** specification.
* For internal use, rely on **TypeScript types as the source of truth** for API contracts.

---

## 4. Implementation Guidelines

### State Management
* **Server State:** Use React Query for anything fetched from the server.
* **Client State:** Use **Zustand** for lightweight global UI state (e.g., modals, sidebar toggles). Avoid `useContext` for high-frequency updates.

### Styling
* **Tailwind CSS:** Use Tailwind for all styling. Follow the "Mobile First" responsive design principle.
* **Type-Safe CSS:** Use tools like `tailwind-merge` and `clsx` to handle conditional class logic cleanly.

### Security
* **Authentication:** Use **NextAuth.js (Auth.js)** or a managed service like Clerk/Kinde.
* **Environment Variables:** Strictly use `process.env` and validate them at runtime using a `env.mjs` pattern to prevent the app from starting with missing secrets.
* **CSP:** Implement a strict Content Security Policy to mitigate XSS risks.

## 1. Functional Core, Imperative Shell

### Core Principles
* **The Functional Core:** All business logic, data transformations, and state transitions must be written as **pure functions**.
    * **Purity:** Functions must take all dependencies as arguments and return a new value without modifying external state or performing I/O.
    * **Determinism:** Given the same input, the core must always produce the same output, making it trivial to unit test without mocks.
* **The Imperative Shell:** The outer layer (Next.js Server Actions, API routes, and useEffects) handles all side effects.
    * **Responsibilities:** Fetching data, writing to the database, logging, and calling the pure functions of the core.
    * **Minimal Logic:** The shell should contain as little branching logic as possible, acting only as a coordinator.

### Implementation Guidelines
* **Immutability:** Use TypeScript's `Readonly<T>` or `readonly` arrays to enforce immutability within the core. Avoid `let` and mutation methods like `.push()` or `.sort()`; use spread syntax (`...`) and `.map()`, `.filter()`, or `.reduce()`.
* **Data Transformation:** Treat UI state or Database records as "Data at Rest." Pass this data into pure functions to get "New Data," then let the Shell persist or display it.
* **Dependency Injection:** If a function needs a configuration value or a date, pass it as an argument rather than reaching for `process.env` or `new Date()` inside the core.

---

## 2. Updated Architecture & Style

### Refined Folder Structure
```text
src/
├── core/           # The Functional Core (Pure logic, no Next.js dependencies)
│   ├── math.ts     # Pure calculation logic
│   └── physics.ts  # Pure state transition rules
├── shell/          # The Imperative Shell (Next.js, DB, Side Effects)
│   ├── actions.ts  # Server Actions that call Core functions
│   └── db.ts       # Database clients and side-effect wrappers
└── components/     # UI layer (The "View" part of the shell)
```

### Coding Examples for the Team
* **Bad (Imperative/Side-effect heavy):**
    ```typescript
    // Logic mixed with DB calls and side effects
    async function updateLevel(userId: string) {
      const user = await db.user.findUnique({ where: { id: userId } });
      user.xp += 100; // Mutation
      if (user.xp > 1000) user.level += 1;
      await db.user.update({ where: { id: userId }, data: user });
    }
    ```
* **Good (Functional Core / Imperative Shell):**
    ```typescript
    // CORE: Pure function (Easy to test)
    export const calculateLevelUp = (user: User, addedXp: number): User => {
      const newXp = user.xp + addedXp;
      const newLevel = newXp > 1000 ? user.level + 1 : user.level;
      return { ...user, xp: newXp, level: newLevel };
    };

    // SHELL: Coordinator (Handles I/O)
    async function levelUpAction(userId: string) {
      const user = await db.user.findUnique({ where: { id: userId } });
      const updatedUser = calculateLevelUp(user, 100); // Call pure core
      await db.user.update({ where: { id: userId }, data: updatedUser });
    }
    ```

### Testing the Core
* Because the **Core** is pure, unit tests should not require complex setups, mocks for Prisma/Next.js, or environment variables. Focus 100% of your unit testing efforts here.

Adding a strict policy on file and function size is essential for maintaining the **Functional Core, Imperative Shell** pattern. Smaller units of code ensure that the "Functional Core" remains truly pure and that the "Imperative Shell" doesn't become a "God Object" that is impossible to reason about.

Add this section to your `GEMINI.md`:

---

## 5. Granularity & Context Management

### The "Low Context" Mandate
To maintain high developer velocity and reduce cognitive load, we strictly enforce small, single-purpose code units. If a file or function requires significant scrolling to understand, it must be refactored.

### Function Constraints
* **Single Responsibility:** Each function must do **one** thing. If you find yourself using the word "and" to describe a function's purpose, it should be split.
* **The 30-Line Rule:** Aim for functions under **30 lines of code**. If a function exceeds this, extract the internal logic into smaller, private helper functions.
* **Cyclomatic Complexity:** Keep branching logic (if/else, switch, loops) to a minimum. Use guard clauses to exit early and keep the "happy path" unindented.

### File & Module Constraints
* **The 150-Line Rule:** Files should ideally not exceed **150 lines**. Once a file reaches this limit, evaluate if a logical submodule can be extracted (e.g., moving utility types to a `.types.ts` file or pure logic to the `core/` directory).
* **Flat Exports:** Avoid "Barrel Files" (index.ts files that export everything from a directory) unless strictly necessary for a public-facing library. Explicit imports keep the dependency graph clear.
* **Colocation:** Keep styles and unit tests as close to the implementation as possible.
    * `component.tsx`
    * `component.test.tsx` (Testing the Shell/UI)
    * `component.logic.ts` (The Functional Core logic for that component)

### Refactoring Triggers
* **"Deep Nesting":** If logic is nested more than 3 levels deep, extract the inner block into a pure function.
* **Multiple Side Effects:** If a function in the **Imperative Shell** performs more than two distinct I/O operations (e.g., fetching a user *and* updating a log *and* sending an email), split it into discrete steps coordinated by a parent "orchestrator" function.
* **Prop Drilling:** If a component is passing data through more than two layers of children without using it, consider refactoring the component composition or using a targeted state slice.

---

### 6. Verification Mandate (The "Done" Standard)

No feature, architectural update, or bug fix is considered **DONE** until the following verification steps are completed successfully:

1.  **Smoke Test:** Run `scripts/smoke-test.sh` to confirm the entire stack (App, DB, Object Store) initializes and responds correctly.
2.  **Unit Tests:** Ensure all tests in the **Functional Core** (`src/core/`) pass.
3.  **Local Reproduction:** For bug fixes, verify the reported issue is resolved in a live containerized environment.

A successful `curl` of the home page (HTTP 200) and confirmation of core UI elements is the minimum requirement for any significant change.
