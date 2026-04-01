import type { Member } from "../../domain/entities.js";

export interface QueryContext {
  actor: Member;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  totalCount?: number;
}

export interface PaginationArgs {
  cursor?: string;
  limit?: number;
}
