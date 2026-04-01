import express from "express";
import crypto from "node:crypto";
import { readConfig } from "../infra/config.js";
import { checkPgReadiness } from "../infra/postgres.js";
import { checkStorageReadiness, getPresignedUploadUrl, getObjectStream, calculateChecksum } from "../infra/storage.js";
import { authHandler, requireAuth, requireAdmin, type AuthenticatedRequest } from "../infra/auth.js";
import { prisma } from "../infra/prisma.js";
import { validateMedia } from "../domain/invariants.js";

// Commands
import { CreateEntryCommand } from "./commands/CreateEntryCommand.js";
import { EditEntryCommand } from "./commands/EditEntryCommand.js";
import { TombstoneEntryCommand } from "./commands/TombstoneEntryCommand.js";
import { CreateCollectionCommand } from "./commands/CreateCollectionCommand.js";
import { InviteMemberCommand } from "./commands/InviteMemberCommand.js";
import { AttachMediaCommand } from "./commands/AttachMediaCommand.js";
import { ToggleLikeCommand } from "./commands/ToggleLikeCommand.js";
import { CreateCommentCommand } from "./commands/CreateCommentCommand.js";
import { MarkNotificationReadCommand } from "./commands/MarkNotificationReadCommand.js";
import { FullExportCommand } from "./commands/FullExportCommand.js";
import { UserTakeoutCommand } from "./commands/UserTakeoutCommand.js";

// Queries
import { GetTimelineQuery } from "./queries/GetTimelineQuery.js";
import { GetMediaGridQuery } from "./queries/GetMediaGridQuery.js";
import { GetMemberProfileQuery } from "./queries/GetMemberProfileQuery.js";
import { SearchEntriesQuery } from "./queries/SearchEntriesQuery.js";
import { GetCollectionSummaryQuery } from "./queries/GetCollectionSummaryQuery.js";
import { ListMembersQuery } from "./queries/ListMembersQuery.js";
import { ListInvitesQuery } from "./queries/ListInvitesQuery.js";
import { GetSystemMetricsQuery } from "./queries/GetSystemMetricsQuery.js";

// Commands (Admin)
import { UpdateUserRoleCommand } from "./commands/UpdateUserRoleCommand.js";
import { ToggleUserStatusCommand } from "./commands/ToggleUserStatusCommand.js";
import { ModerationDeleteEntryCommand } from "./commands/ModerationDeleteEntryCommand.js";
import { RevokeInviteCommand } from "./commands/RevokeInviteCommand.js";

const cfg = readConfig();
const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use("/api/auth/*", authHandler);

// Helper to get member from session
const getActor = (req: express.Request) => (req as AuthenticatedRequest).session.user as any;

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: getActor(req) });
});

/**
 * ENTRIES & FEED
 */
app.get("/api/entries", requireAuth, async (req, res) => {
  const query = new GetTimelineQuery();
  const result = await query.execute(
    { actor: getActor(req) }, 
    { 
      cursor: req.query.cursor as string, 
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined 
    }
  );
  res.json(result);
});

app.post("/api/entries", requireAuth, async (req, res) => {
  try {
    const cmd = new CreateEntryCommand();
    const result = await cmd.execute({ actor: getActor(req), ip: req.ip }, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.get("/api/search", requireAuth, async (req, res) => {
  const query = new SearchEntriesQuery();
  const result = await query.execute(
    { actor: getActor(req) },
    {
      query: req.query.q as string || "",
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    }
  );
  res.json(result);
});

app.patch("/api/entries/:id", requireAuth, async (req, res) => {
  try {
    const cmd = new EditEntryCommand();
    const result = await cmd.execute(
      { actor: getActor(req), ip: req.ip }, 
      { ...req.body, entryId: req.params.id }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.delete("/api/entries/:id", requireAuth, async (req, res) => {
  try {
    const cmd = new TombstoneEntryCommand();
    const result = await cmd.execute(
      { actor: getActor(req), ip: req.ip }, 
      { entryId: req.params.id }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * MEMBERS
 */
app.get("/api/members/:id", requireAuth, async (req, res) => {
  try {
    const query = new GetMemberProfileQuery();
    const result = await query.execute(
      { actor: getActor(req) },
      {
        memberId: req.params.id,
        cursor: req.query.cursor as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      }
    );
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

/**
 * ARCHIVE NAVIGATION
 */

// Timeline summary: years/months with counts
app.get("/api/archive/timeline", requireAuth, async (_req, res) => {
  const result = await prisma.$queryRaw`
    SELECT 
      EXTRACT(YEAR FROM "createdAt")::text as year, 
      EXTRACT(MONTH FROM "createdAt")::text as month, 
      COUNT(*)::int as count
    FROM "Entry"
    WHERE "tombstonedAt" IS NULL
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `;
  res.json(result);
});

// Entries for a specific year/month
app.get("/api/archive/timeline/:year/:month", requireAuth, async (req, res) => {
  const { year, month } = req.params;
  const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
  const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 1));

  const entries = await prisma.entry.findMany({
    where: {
      tombstonedAt: null,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: {
      author: { select: { id: true, email: true } },
      revisions: { orderBy: { createdAt: "desc" }, take: 1 },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(entries);
});

// Contributor index
app.get("/api/archive/people", requireAuth, async (_req, res) => {
  const people = await prisma.user.findMany({
    where: {
      entries: { some: { tombstonedAt: null } }
    },
    select: {
      id: true,
      email: true,
      _count: {
        select: { entries: { where: { tombstonedAt: null } } }
      }
    },
    orderBy: { entries: { _count: "desc" } }
  });
  res.json(people);
});

// Tag index
app.get("/api/archive/tags", requireAuth, async (_req, res) => {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { entries: { where: { entry: { tombstonedAt: null } } } }
      }
    },
    orderBy: { name: "asc" }
  });
  res.json(tags);
});

// On This Day
app.get("/api/archive/on-this-day", requireAuth, async (_req, res) => {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();

  const entries = await prisma.$queryRaw`
    SELECT e.*, u.email as "authorEmail"
    FROM "Entry" e
    JOIN "User" u ON e."authorId" = u.id
    WHERE e."tombstonedAt" IS NULL
      AND EXTRACT(MONTH FROM e."createdAt") = ${month}
      AND EXTRACT(DAY FROM e."createdAt") = ${day}
      AND EXTRACT(YEAR FROM e."createdAt") < ${now.getUTCFullYear()}
    ORDER BY e."createdAt" DESC
  `;
  res.json(entries);
});

/**
 * INTERACTIONS
 */
app.post("/api/entries/:id/like", requireAuth, async (req, res) => {
  try {
    const cmd = new ToggleLikeCommand();
    const result = await cmd.execute(
      { actor: getActor(req), ip: req.ip }, 
      { entryId: req.params.id }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post("/api/entries/:id/comments", requireAuth, async (req, res) => {
  try {
    const cmd = new CreateCommentCommand();
    const result = await cmd.execute(
      { actor: getActor(req), ip: req.ip }, 
      { ...req.body, entryId: req.params.id }
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * NOTIFICATIONS
 */
app.get("/api/notifications", requireAuth, async (req, res) => {
  const actor = getActor(req);
  const notifications = await prisma.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
});

app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const cmd = new MarkNotificationReadCommand();
    await cmd.execute(
      { actor: getActor(req), ip: req.ip }, 
      { notificationId: req.params.id }
    );
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * ACTIVITY STREAM
 */
app.get("/api/activity", requireAuth, async (req, res) => {
  const [likes, comments] = await Promise.all([
    prisma.like.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { email: true } } }
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: { select: { email: true } } }
    })
  ]);

  const activity = [
    ...likes.map(l => ({ type: "LIKE", ...l })),
    ...comments.map(c => ({ type: "COMMENT", ...c }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);

  res.json(activity);
});

/**
 * COLLECTIONS
 */
app.get("/api/collections", requireAuth, async (req, res) => {
  const query = new GetCollectionSummaryQuery();
  const result = await query.execute({ actor: getActor(req) });
  res.json(result);
});

app.get("/api/collections/:id/entries", requireAuth, async (req, res) => {
  const entries = await prisma.entry.findMany({
    where: {
      tombstonedAt: null,
      collections: { some: { collectionId: req.params.id } }
    },
    include: {
      author: { select: { id: true, email: true } },
      revisions: { orderBy: { createdAt: "desc" }, take: 1 },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(entries);
});

app.post("/api/collections", requireAuth, async (req, res) => {
  try {
    const cmd = new CreateCollectionCommand();
    const result = await cmd.execute({ actor: getActor(req), ip: req.ip }, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * MEDIA
 */
app.get("/api/media", requireAuth, async (req, res) => {
  const query = new GetMediaGridQuery();
  const result = await query.execute(
    { actor: getActor(req) },
    {
      mimeTypePrefix: req.query.type as string,
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    }
  );
  res.json(result);
});

app.post("/api/media/upload/init", requireAuth, async (req, res) => {
  const { fileName, fileSize, mimeType } = req.body;
  try {
    validateMedia(fileName, fileSize, mimeType);
    const s3Key = `uploads/${crypto.randomUUID()}-${fileName}`;
    const media = await prisma.media.create({
      data: { fileName, fileSize, mimeType, s3Key, status: "PENDING" }
    });
    const uploadUrl = await getPresignedUploadUrl(cfg, s3Key, mimeType);
    res.json({ mediaId: media.id, uploadUrl, s3Key });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.post("/api/media/upload/complete", requireAuth, async (req, res) => {
  const { mediaId, revisionId } = req.body;
  try {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error("Media not found");

    // Calculate checksum
    const stream = await getObjectStream(cfg, media.s3Key);
    const sha256 = await calculateChecksum(stream);

    await prisma.media.update({
      where: { id: mediaId },
      data: { status: "READY", sha256 },
    });
    
    if (revisionId) {
      const cmd = new AttachMediaCommand();
      await cmd.execute({ actor: getActor(req), ip: req.ip }, { mediaId, revisionId });
    }

    res.json({ status: "READY", mediaId, sha256 });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * ADMIN - MEMBERS
 */
app.get("/api/admin/members", requireAdmin, async (req, res) => {
  const query = new ListMembersQuery();
  const result = await query.execute(
    { actor: getActor(req) },
    {
      isActive: req.query.active === "true" ? true : req.query.active === "false" ? false : undefined,
      cursor: req.query.cursor as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    }
  );
  res.json(result);
});

app.patch("/api/admin/members/:id/role", requireAdmin, async (req, res) => {
  try {
    const cmd = new UpdateUserRoleCommand();
    await cmd.execute(
      { actor: getActor(req), ip: req.ip },
      { userId: req.params.id, role: req.body.role }
    );
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

app.patch("/api/admin/members/:id/status", requireAdmin, async (req, res) => {
  try {
    const cmd = new ToggleUserStatusCommand();
    await cmd.execute(
      { actor: getActor(req), ip: req.ip },
      { userId: req.params.id, isActive: req.body.isActive }
    );
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * ADMIN - MODERATION
 */
app.delete("/api/admin/entries/:id", requireAdmin, async (req, res) => {
  try {
    const cmd = new ModerationDeleteEntryCommand();
    await cmd.execute(
      { actor: getActor(req), ip: req.ip },
      { entryId: req.params.id }
    );
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * ADMIN - INVITES
 */
app.get("/api/admin/invites", requireAdmin, async (req, res) => {
  const query = new ListInvitesQuery();
  const result = await query.execute({ actor: getActor(req) });
  res.json(result);
});

app.delete("/api/admin/invites/:id", requireAdmin, async (req, res) => {
  try {
    const cmd = new RevokeInviteCommand();
    await cmd.execute(
      { actor: getActor(req), ip: req.ip },
      { inviteId: req.params.id }
    );
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * ADMIN - SYSTEM
 */
app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
  try {
    const query = new GetSystemMetricsQuery();
    const result = await query.execute({ actor: getActor(req) });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * EXPORTS
 */
app.get("/api/admin/export", requireAdmin, async (req, res) => {
  try {
    const cmd = new FullExportCommand();
    const archive = await cmd.execute({ actor: getActor(req), ip: req.ip });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=analog-export-${new Date().toISOString().split('T')[0]}.zip`);
    // @ts-expect-error archiver returns a stream but types are tricky
    archive.pipe(res);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/me/export", requireAuth, async (req, res) => {
  try {
    const cmd = new UserTakeoutCommand();
    const archive = await cmd.execute({ actor: getActor(req), ip: req.ip });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=analog-takeout-${new Date().toISOString().split('T')[0]}.zip`);
    // @ts-expect-error archiver returns a stream but types are tricky
    archive.pipe(res);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * INVITES (Admin only)
 */
app.post("/api/invites", requireAuth, async (req, res) => {
  try {
    const cmd = new InviteMemberCommand();
    const result = await cmd.execute({ actor: getActor(req), ip: req.ip }, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/ready", async (_req, res) => {
  const [dbReady, storageReady] = await Promise.all([
    checkPgReadiness(cfg),
    checkStorageReadiness(cfg)
  ]);
  if (!dbReady || !storageReady) {
    res.status(503).json({ status: "not_ready", details: { dbReady, storageReady } });
    return;
  }
  res.status(200).json({ status: "ready", details: { dbReady, storageReady }});
});

app.listen(cfg.PORT, () => {
  console.log(`Analog app listening on :${cfg.PORT} (${cfg.INSTANCE_NAME})`);
});
