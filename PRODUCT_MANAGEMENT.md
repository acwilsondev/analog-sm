# Product Management Framework - Analog SM

This document defines the process for managing the development of Analog SM. It outlines how we categorize work, prioritize features, and track progress using a lightweight, Markdown-driven documentation style.

## 1. Work Hierarchy

We use a three-tier hierarchy to organize the roadmap and day-to-day development.

### 1.1 Initiatives (Strategic)

- **Definition:** High-level strategic goals that represent major milestones for the project.
- **Artifact:** Tracked in `docs/roadmap.md`.
- **Categorization:**
  - `(e)` Enhancement: New features or improvements.
  - `(t)` Tech Debt: Backend stability, refactoring, or infrastructure updates.

### 1.2 Epics (Functional)

- **Definition:** A significant body of work that groups related Stories together.
- **Artifact:** Tracked in `docs/epics.md` and individual `docs/epic-N-title.md` files.

### 1.3 Stories & Tasks (Tactical)

- **Definition:** The smallest unit of work.
  - **User Story:** A feature described from the user's perspective.
  - **Technical Task:** A specific implementation detail.
- **Artifact:** Listed within the individual `docs/epic-N-title.md` files.

---

## 2. Process for Enhancements & Bugs

### 2.1 Enhancements (New Features)

1. **Proposal:** Add to the `Roadmap` section in `docs/roadmap.md` marked as `(e)`.
2. **Detailed Planning:** Once an initiative moves to the active phase, create a dedicated Epic file in `docs/`.
3. **Implementation:** Work is broken into Stories and Tasks within the Epic file.

### 2.2 Bug Management

1. **Reporting:** Tracked in a `docs/bugs.md` file (if applicable) or as technical tasks within an Epic.
2. **Resolution:** A fix is only considered "done" when it passes all validation steps defined in `GEMINI.md`.

---

## 3. Roadmapping & Planning

- **Continuous Discovery:** New ideas are captured in the `Unplanned Features` section of `docs/roadmap.md`.
- **Initiative Lifecycle:**
    1. **Roadmap:** Planned for future versions.
    2. **Active:** Currently under development (listed in `docs/epics.md`).
    3. **Completed:** Successfully verified; epic files moved to `docs/archive/vX.X/`.

---

## 4. Documentation Standards

- **Keep Docs in Sync:** If a story changes the system's behavior, the relevant `docs/*.md` files must be updated.
- **Style:** Follow the "RustLike" style: lean Markdown files, clear hierarchy, and surgical updates.
