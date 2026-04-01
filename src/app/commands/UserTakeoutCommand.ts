import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { getObjectStream } from "../../infra/storage.js";
import { readConfig } from "../../infra/config.js";
import archiver from "archiver";
import { Stream } from "node:stream";

const cfg = readConfig();

export class UserTakeoutCommand extends BaseCommand<void, Stream> {
  async execute(ctx: CommandContext) {
    const userId = ctx.actor.id;

    const [entries, revisions, comments, likes, media] = await Promise.all([
      prisma.entry.findMany({ where: { authorId: userId } }),
      prisma.revision.findMany({ where: { entry: { authorId: userId } } }),
      prisma.comment.findMany({ where: { authorId: userId } }),
      prisma.like.findMany({ where: { userId } }),
      prisma.media.findMany({ 
        where: { 
          status: "READY",
          revision: { entry: { authorId: userId } }
        } 
      }),
    ]);

    const data = {
      version: "1.0",
      user: { id: ctx.actor.id, email: ctx.actor.email },
      exportedAt: new Date().toISOString(),
      entries,
      revisions,
      comments,
      likes,
      media,
    };

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.append(JSON.stringify(data, null, 2), { name: "takeout.json" });

    for (const m of media) {
      const stream = await getObjectStream(cfg, m.s3Key);
      archive.append(stream, { name: `media/${m.s3Key.split('/').pop()}` });
    }

    archive.finalize();

    await this.logAction(ctx, "USER_TAKEOUT", { mediaCount: media.length });

    return archive;
  }
}
