import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../infra/prisma.js";
import { UpdateUserRoleCommand } from "./UpdateUserRoleCommand.js";
import { ToggleUserStatusCommand } from "./ToggleUserStatusCommand.js";
import { ModerationDeleteEntryCommand } from "./ModerationDeleteEntryCommand.js";
import { RevokeInviteCommand } from "./RevokeInviteCommand.js";
import { CreateEntryCommand } from "./CreateEntryCommand.js";
import { InviteMemberCommand } from "./InviteMemberCommand.js";
import type { Member } from "../../domain/entities.js";

test("Admin Commands Integration", async (t) => {
  const ts = Date.now();
  const admin: Member = await prisma.user.create({
    data: { email: `admin-${ts}@example.com`, role: "admin", isActive: true }
  }) as any;

  const user: Member = await prisma.user.create({
    data: { email: `user-${ts}@example.com`, role: "member", isActive: true }
  }) as any;

  const ctx = { actor: admin };

  await t.test("UpdateUserRoleCommand changes role", async () => {
    const cmd = new UpdateUserRoleCommand();
    await cmd.execute(ctx, { userId: user.id, role: "admin" });
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    assert.strictEqual(updated?.role, "admin");
  });

  await t.test("ToggleUserStatusCommand changes status", async () => {
    const cmd = new ToggleUserStatusCommand();
    await cmd.execute(ctx, { userId: user.id, isActive: false });
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    assert.strictEqual(updated?.isActive, false);
  });

  await t.test("ModerationDeleteEntryCommand removes entry", async () => {
    const createCmd = new CreateEntryCommand();
    const { entryId } = await createCmd.execute({ actor: user }, { content: "Bad content" });
    
    const deleteCmd = new ModerationDeleteEntryCommand();
    await deleteCmd.execute(ctx, { entryId });
    
    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    assert.strictEqual(entry, null);
  });

  await t.test("RevokeInviteCommand removes invite", async () => {
    const inviteCmd = new InviteMemberCommand();
    const { inviteId } = await inviteCmd.execute(ctx, { role: "member" });
    
    const revokeCmd = new RevokeInviteCommand();
    await revokeCmd.execute(ctx, { inviteId });
    
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    assert.strictEqual(invite, null);
  });

  // Cleanup
  await prisma.user.deleteMany({
    where: { id: { in: [admin.id, user.id] } }
  });
});
