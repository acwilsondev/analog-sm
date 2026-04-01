# Analog — v1 Epic Map

Analog is a private, durable, portable social archive for a single community.

These epics define the roadmap for v1. They are organized to reinforce

- Archive-first design
- Functional + CQRS architecture
- Data durability and portability
- Calm, humane UX

---

## DONE - EPIC 0 — Foundation & Operability

> “Can this run, be upgraded, and be recovered?”

**Goal:** A deployable, backup-safe instance.

---

## DONE - EPIC 1 — Identity, Access & Trust

> “Who is allowed in, and how do they stay safe?”

**Goal:** Private, invite-only community.

---

## DONE - EPIC 2 — Domain Core (Archive Primitives)

> “What *is* an archive entry?”

**Goal:** Stable, versioned domain model.

---

## DONE - EPIC 3 — Capture & Upload Pipeline

> “Can people post from a phone in chaos?”

**Goal:** Fast, reliable capture.

---

## DONE - EPIC 4 — Write Path (Commands)

> “How does state change?”

**Goal:** Explicit, auditable mutation.

---

## DONE - EPIC 5 — Read Path (Queries & Projections)

> “How do people browse history?”

**Goal:** Fast, predictable retrieval.

---

## DONE - EPIC 6 — Interaction Layer

> “How do people respond to memories?”

**Goal:** Minimal, humane interaction.

---

## DONE - EPIC 7 — Archive Navigation & Revisit

> “Can I find ‘that night’ years later?”

**Goal:** Long-term discoverability.

---

## DONE - EPIC 8 — Export, Portability & Stewardship

> “Can we leave if we want?”

**Goal:** Sovereignty and portability.

---

## DONE - EPIC 9 — Admin & Moderation

> “Can humans govern this?”

**Goal:** Lightweight governance.

---

## DEFERRED - EPIC X — UX & Aesthetic Cohesion (Placeholder)

> “Does it feel like Analog?”

**Goal:** Calm, durable interface. (Deferred until frontend implementation begins).

---

## Guiding Constraint

Every epic must support:

> Analog is a private, durable, portable social archive.

If a feature undermines durability, sovereignty, or clarity, reconsider it.
