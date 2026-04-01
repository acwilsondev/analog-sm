import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../infra/prisma.js";
import { CreateEntryCommand } from "./CreateEntryCommand.js";
import { EditEntryCommand } from "./EditEntryCommand.js";
import { TombstoneEntryCommand } from "./TombstoneEntryCommand.js";
import type { Member } from "../../domain/entities.js";

test("Entry Commands Integration", async (t) => {
  // Setup: create a user
  const actor: Member = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      role: "admin",
      isActive: true,
    }
  }) as any;

  const ctx = { actor };

  await t.test("CreateEntryCommand creates entry and revision", async () => {
    const cmd = new CreateEntryCommand();
    const result = await cmd.execute(ctx, { content: "Hello World" });
    
    assert.ok(result.entryId);
    assert.ok(result.revisionId);

    const entry = await prisma.entry.findUnique({
      where: { id: result.entryId },
      include: { revisions: true }
    });

    assert.strictEqual(entry?.authorId, actor.id);
    assert.strictEqual(entry?.revisions.length, 1);
    assert.strictEqual(entry?.revisions[0].content, "Hello World");
  });

  await t.test("EditEntryCommand creates new revision", async () => {
    const createCmd = new CreateEntryCommand();
    const { entryId } = await createCmd.execute(ctx, { content: "V1" });

    const editCmd = new EditEntryCommand();
    const { revisionId } = await editCmd.execute(ctx, { entryId, content: "V2" });

    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { revisions: { orderBy: { createdAt: 'asc' } } }
    });

    assert.strictEqual(entry?.revisions.length, 2);
    assert.strictEqual(entry?.revisions[1].content, "V2");
    assert.strictEqual(entry?.revisions[1].id, revisionId);
  });

  await t.test("TombstoneEntryCommand soft-deletes", async () => {
    const createCmd = new CreateEntryCommand();
    const { entryId } = await createCmd.execute(ctx, { content: "To be deleted" });

    const deleteCmd = new TombstoneEntryCommand();
    await deleteCmd.execute(ctx, { entryId });

    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    assert.ok(entry?.tombstonedAt);
  });

  // Cleanup
  await prisma.user.delete({ where: { id: actor.id } });
});
