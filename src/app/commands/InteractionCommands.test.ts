import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../infra/prisma.js";
import { CreateEntryCommand } from "./CreateEntryCommand.js";
import { ToggleLikeCommand } from "./ToggleLikeCommand.js";
import { CreateCommentCommand } from "./CreateCommentCommand.js";
import type { Member } from "../../domain/entities.js";

test("Interaction Commands Integration", async (t) => {
  const ts = Date.now();
  const author: Member = await prisma.user.create({
    data: { email: `author-${ts}@example.com`, role: "member", isActive: true }
  }) as any;

  const reader: Member = await prisma.user.create({
    data: { email: `reader-${ts}@example.com`, role: "member", isActive: true }
  }) as any;

  const entryResult = await new CreateEntryCommand().execute({ actor: author }, { content: "Author's post" });

  await t.test("ToggleLikeCommand creates notification for author", async () => {
    const cmd = new ToggleLikeCommand();
    const result = await cmd.execute({ actor: reader }, { entryId: entryResult.entryId });
    assert.strictEqual(result.liked, true);

    const notification = await prisma.notification.findFirst({
      where: { userId: author.id, type: "LIKE" }
    });
    assert.ok(notification);
    assert.strictEqual((notification.data as any).actorId, reader.id);
  });

  await t.test("CreateCommentCommand handles threading and notifications", async () => {
    const cmd = new CreateCommentCommand();
    const result = await cmd.execute({ actor: reader }, { 
      entryId: entryResult.entryId, 
      content: `Nice post @${author.email}` 
    });

    // Notify author of comment
    const commentNotify = await prisma.notification.findFirst({
      where: { userId: author.id, type: "COMMENT" }
    });
    assert.ok(commentNotify);

    // MENTION notification (though here it's also the author, our logic should handle it)
    // In our command, we skip MENTION if it's the author to avoid double notify.
    // Let's test mention for a 3rd user.
    const bystander: Member = await prisma.user.create({
      data: { email: `bystander-${ts}@example.com`, role: "member", isActive: true }
    }) as any;

    await cmd.execute({ actor: reader }, {
      entryId: entryResult.entryId,
      content: `Hey @${bystander.email} check this out`
    });

    const mentionNotify = await prisma.notification.findFirst({
      where: { userId: bystander.id, type: "MENTION" }
    });
    assert.ok(mentionNotify);
    assert.strictEqual((mentionNotify.data as any).actorId, reader.id);
  });

  // Cleanup
  await prisma.user.deleteMany({
    where: { id: { in: [author.id, reader.id] } }
  });
});
