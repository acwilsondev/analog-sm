/**
 * Member represents an authenticated person in a single Analog archive instance.
 */
export type Member = {
  id: string;
  email: string | null;
  role: "admin" | "member";
  isActive: boolean;
  createdAt: Date;
};

/**
 * Entry is the top-level aggregate for a post in the archive.
 */
export type Entry = {
  id: string;
  authorId: string;
  tombstonedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Revision represents a specific version of an Entry's content.
 */
export type Revision = {
  id: string;
  entryId: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

/**
 * Media represents a file attachment linked to a Revision.
 */
export type Media = {
  id: string;
  revisionId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  sha256?: string | null;
  blurHash?: string;
  status: "PENDING" | "READY" | "FAILED";
  createdAt: Date;
};

/**
 * Collection allows grouping entries together.
 */
export type Collection = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  createdAt: Date;
};

/**
 * Tag represents a descriptive label for entries.
 */
export type Tag = {
  id: string;
  name: string;
  createdAt: Date;
};

/**
 * Like represents a user's reaction to an entry.
 */
export type Like = {
  userId: string;
  entryId: string;
  createdAt: Date;
};

/**
 * Comment represents a discussion post on an entry.
 */
export type Comment = {
  id: string;
  authorId: string;
  entryId: string;
  parentId?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Notification alerts a user to interactions.
 */
export type Notification = {
  id: string;
  userId: string;
  type: string;
  data?: Record<string, unknown> | null;
  readAt?: Date | null;
  createdAt: Date;
};

/**
 * Invite represents a code that can be used to join the instance.
 */
export type Invite = {
  id: string;
  code: string;
  email?: string | null;
  role: "admin" | "member";
  maxUses: number;
  useCount: number;
  expiresAt?: Date | null;
  createdBy: string;
  createdAt: Date;
};

/**
 * AuditLog records security-relevant events.
 */
export type AuditLog = {
  id: string;
  userId?: string | null;
  action: string;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: Date;
};
