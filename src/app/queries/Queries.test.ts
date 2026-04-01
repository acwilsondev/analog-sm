import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../infra/prisma.js";
import { CreateEntryCommand } from "../commands/CreateEntryCommand.js";
import { GetTimelineQuery } from "./GetTimelineQuery.js";
import { SearchEntriesQuery } from "./SearchEntriesQuery.js";
import { GetMemberProfileQuery } from "./GetMemberProfileQuery.js";
import type { Member } from "../../domain/entities.js";

test("Archive Queries Integration", async (t) => {
  const ts = Date.now();
  const actor: Member = await prisma.user.create({
    data: { email: `query-tester-${ts}@example.com`, role: "admin", isActive: true }
  }) as any;

  const ctx = { actor };
  const createCmd = new CreateEntryCommand();

  await createCmd.execute(ctx, { content: "UniqueSearchKeyword and some other text" });
  await createCmd.execute(ctx, { content: "Another entry for timeline" });

  await t.test("GetTimelineQuery returns entries", async () => {
    const query = new GetTimelineQuery();
    const result = await query.execute(ctx, {});
    assert.ok(result.data.length >= 2);
    assert.ok(result.data[0].revisions.length > 0);
  });

  await t.test("SearchEntriesQuery finds by keyword", async () => {
    const query = new SearchEntriesQuery();
    const result = await query.execute(ctx, { query: "UniqueSearchKeyword" });
    assert.strictEqual(result.data.length, 1);
    assert.ok(result.data[0].revisions[0].content.includes("UniqueSearchKeyword"));
  });

  await t.test("GetMemberProfileQuery returns stats", async () => {
    const query = new GetMemberProfileQuery();
    const result = await query.execute(ctx, { memberId: actor.id });
    assert.strictEqual(result.member.email, actor.email);
    assert.ok(result.member._count.entries >= 2);
    assert.strictEqual(result.entries.data.length, 2);
  });

  // Cleanup
  await prisma.user.delete({ where: { id: actor.id } });
});
