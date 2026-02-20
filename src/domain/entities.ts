/**
 * Member represents an authenticated person in a single Analog archive instance.
 * Invariants: id is stable, role is either admin or member, joinedAt is immutable.
 * Lifecycle: created from invite/bootstrap, may be deactivated but not hard-deleted in normal flows.
 * Non-responsibilities: password/auth token management and persistence.
 */
export type Member = {
  id: string;
  email: string;
  role: "admin" | "member";
  joinedAt: Date;
};
