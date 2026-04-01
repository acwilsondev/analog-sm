import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";
import { getObjectStream } from "../../infra/storage.js";
import { readConfig } from "../../infra/config.js";
import archiver from "archiver";
import { Stream } from "node:stream";

const cfg = readConfig();

export class FullExportCommand extends BaseCommand<void, Stream> {
  async execute(ctx: CommandContext) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can perform full export.");
    }

    const [users, entries, revisions, comments, likes, tags, media] = await Promise.all([
      prisma.user.findMany(),
      prisma.entry.findMany(),
      prisma.revision.findMany(),
      prisma.comment.findMany(),
      prisma.like.findMany(),
      prisma.tag.findMany(),
      prisma.media.findMany({ where: { status: "READY" } }),
    ]);

    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      users,
      entries,
      revisions,
      comments,
      likes,
      tags,
      media,
    };

    const archive = archiver("zip", { zlib: { level: 9 } });

    // Add JSON data
    archive.append(JSON.stringify(data, null, 2), { name: "data.json" });

    // Add media files
    for (const m of media) {
      const stream = await getObjectStream(cfg, m.s3Key);
      archive.append(stream, { name: `media/${m.s3Key.split('/').pop()}` });
    }

    archive.finalize();

    await this.logAction(ctx, "FULL_EXPORT", { mediaCount: media.length });

    return archive;
  }
}
