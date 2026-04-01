import test from "node:test";
import assert from "node:assert/strict";
import type { Member, Entry, Like, Collection, Comment } from "./entities.js";
import { validateLike, canUpdateEntry, validateCollectionAddition, validateComment, validateMedia } from "./invariants.js";

const mockUser: Member = {
  id: "u1",
  email: "u1@example.com",
  role: "member",
  isActive: true,
  createdAt: new Date(),
};

const mockEntry: Entry = {
  id: "e1",
  authorId: "u1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("validateLike: allows unique like", () => {
  assert.doesNotThrow(() => validateLike(mockUser, mockEntry, []));
});

test("validateLike: throws on duplicate like", () => {
  const existingLikes: Like[] = [{ userId: "u1", entryId: "e1", createdAt: new Date() }];
  assert.throws(
    () => validateLike(mockUser, mockEntry, existingLikes),
    { name: "DomainError", message: "User has already liked this entry." }
  );
});

test("validateLike: throws for inactive user", () => {
  const inactiveUser = { ...mockUser, isActive: false };
  assert.throws(
    () => validateLike(inactiveUser, mockEntry, []),
    { name: "DomainError", message: "Inactive users cannot perform actions." }
  );
});

test("canUpdateEntry: author can update", () => {
  assert.strictEqual(canUpdateEntry(mockUser, mockEntry), true);
});

test("canUpdateEntry: admin can update", () => {
  const admin: Member = { ...mockUser, id: "admin1", role: "admin" };
  assert.strictEqual(canUpdateEntry(admin, mockEntry), true);
});

test("canUpdateEntry: other member cannot update", () => {
  const other: Member = { ...mockUser, id: "u2" };
  assert.strictEqual(canUpdateEntry(other, mockEntry), false);
});

test("validateCollectionAddition: owner can add", () => {
  const collection: Collection = { id: "c1", ownerId: "u1", name: "My Stuff", createdAt: new Date() };
  assert.doesNotThrow(() => validateCollectionAddition(mockUser, collection));
});

test("validateCollectionAddition: non-owner cannot add", () => {
  const other: Member = { ...mockUser, id: "u2" };
  const collection: Collection = { id: "c1", ownerId: "u1", name: "My Stuff", createdAt: new Date() };
  assert.throws(
    () => validateCollectionAddition(other, collection),
    { name: "DomainError", message: "Only the collection owner can add entries." }
  );
});

test("validateComment: basic validation", () => {
  assert.doesNotThrow(() => validateComment(mockUser, "Valid comment"));
});

test("validateComment: empty content", () => {
  assert.throws(() => validateComment(mockUser, ""), { message: "Comment content cannot be empty." });
});

test("validateComment: too long content", () => {
  assert.throws(() => validateComment(mockUser, "a".repeat(2001)), { message: "Comment content is too long." });
});

test("validateComment: threading limit", () => {
  const parentComment: Comment = {
    id: "p1",
    authorId: "u2",
    entryId: "e1",
    content: "Parent",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const replyComment: Comment = { ...parentComment, id: "p2", parentId: "p1" };
  
  assert.doesNotThrow(() => validateComment(mockUser, "Reply", parentComment));
  assert.throws(
    () => validateComment(mockUser, "Reply to reply", replyComment),
    { message: "Deeply nested comments are not allowed." }
  );
});

test("validateMedia: basic validation", () => {
  assert.doesNotThrow(() => validateMedia("test.jpg", 1024, "image/jpeg"));
  assert.doesNotThrow(() => validateMedia("test.mp4", 1024 * 1024, "video/mp4"));
});

test("validateMedia: size limit", () => {
  assert.throws(
    () => validateMedia("big.jpg", 101 * 1024 * 1024, "image/jpeg"),
    { message: "File size exceeds 100MB limit." }
  );
});

test("validateMedia: type validation", () => {
  assert.throws(
    () => validateMedia("test.pdf", 1024, "application/pdf"),
    { message: "File type application/pdf is not supported." }
  );
});
