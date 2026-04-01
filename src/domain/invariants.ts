import type { Member, Entry, Like, Collection, Comment } from "./entities.js";

/**
 * DomainError represents a business rule violation.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Ensures a user can only like an entry if they haven't liked it already.
 */
export const validateLike = (user: Member, entry: Entry, existingLikes: Like[]): void => {
  if (!user.isActive) {
    throw new DomainError("Inactive users cannot perform actions.");
  }
  
  const alreadyLiked = existingLikes.some(
    (like) => like.userId === user.id && like.entryId === entry.id
  );
  
  if (alreadyLiked) {
    throw new DomainError("User has already liked this entry.");
  }
};

/**
 * Ensures only the author or an admin can edit/add revisions to an entry.
 */
export const canUpdateEntry = (user: Member, entry: Entry): boolean => {
  if (!user.isActive) return false;
  return user.role === "admin" || entry.authorId === user.id;
};

/**
 * Ensures a user can only add entries to a collection they own.
 */
export const validateCollectionAddition = (user: Member, collection: Collection): void => {
  if (!user.isActive) {
    throw new DomainError("Inactive users cannot perform actions.");
  }
  
  if (collection.ownerId !== user.id) {
    throw new DomainError("Only the collection owner can add entries.");
  }
};

/**
 * Validates comment content and threading.
 */
export const validateComment = (user: Member, content: string, parent?: Comment): void => {
  if (!user.isActive) {
    throw new DomainError("Inactive users cannot perform actions.");
  }

  if (content.trim().length === 0) {
    throw new DomainError("Comment content cannot be empty.");
  }

  if (content.length > 2000) {
    throw new DomainError("Comment content is too long.");
  }

  if (parent && parent.parentId) {
    throw new DomainError("Deeply nested comments are not allowed.");
  }
};

/**
 * Validates media metadata before allowing upload.
 */
export const validateMedia = (fileName: string, fileSize: number, mimeType: string): void => {
  if (fileSize > 100 * 1024 * 1024) {
    throw new DomainError("File size exceeds 100MB limit.");
  }

  const allowedTypes = ["image/", "video/"];
  const isAllowed = allowedTypes.some((type) => mimeType.startsWith(type));

  if (!isAllowed) {
    throw new DomainError(`File type ${mimeType} is not supported.`);
  }

  if (fileName.length === 0) {
    throw new DomainError("File name cannot be empty.");
  }
};
