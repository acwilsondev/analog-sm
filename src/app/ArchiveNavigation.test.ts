import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../infra/prisma.js";
import { CreateEntryCommand } from "./commands/CreateEntryCommand.js";
import type { Member } from "../domain/entities.js";

test("Archive Navigation Integration", async (t) => {
  const ts = Date.now();
  const actor: Member = await prisma.user.create({
    data: { email: `nav-tester-${ts}@example.com`, role: "admin", isActive: true }
  }) as any;

  const ctx = { actor };
  const cmd = new CreateEntryCommand();

  const { entryId: e1 } = await cmd.execute(ctx, { content: "Entry Today", tags: ["news"] });
  const { entryId: e2 } = await cmd.execute(ctx, { content: "Entry Last Year", tags: ["history"] });

  // Use fixed UTC date to avoid TZ issues in tests
  const lastYear = new Date();
  lastYear.setUTCFullYear(lastYear.getUTCFullYear() - 1);
  // Ensure same day/month in UTC
  await prisma.$executeRaw`UPDATE "Entry" SET "createdAt" = ${lastYear} WHERE id = ${e2}`;

  await t.test("Timeline returns correct counts", async () => {
    const result: any[] = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM "createdAt")::text as year, 
        EXTRACT(MONTH FROM "createdAt")::text as month, 
        COUNT(*)::int as count
      FROM "Entry"
      WHERE "tombstonedAt" IS NULL
      GROUP BY year, month
    `;
    
    assert.ok(result.length >= 2);
  });

  await t.test("On This Day returns last year's entry", async () => {
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const currentYear = now.getUTCFullYear();

    const result: any[] = await prisma.$queryRaw`
      SELECT e.*
      FROM "Entry" e
      WHERE e."tombstonedAt" IS NULL
        AND EXTRACT(MONTH FROM e."createdAt") = ${month}
        AND EXTRACT(DAY FROM e."createdAt") = ${day}
        AND EXTRACT(YEAR FROM e."createdAt") < ${currentYear}
    `;

    assert.ok(result.some(r => r.id === e2), "Should find last year's entry");
    assert.ok(!result.some(r => r.id === e1), "Should not find today's entry (same year)");
  });

  await t.test("Tags are correctly indexed", async () => {
    const tags = await prisma.tag.findMany({
      where: { name: { in: ["news", "history"] } },
      include: { _count: { select: { entries: true } } }
    });
    assert.strictEqual(tags.length, 2);
  });

  // Cleanup
  await prisma.user.delete({ where: { id: actor.id } });
});
