import { prisma } from "../../infra/prisma.js";
import { type QueryContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export class GetSystemMetricsQuery {
  async execute(ctx: QueryContext) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can view system metrics.");
    }

    const [
      userCount,
      entryCount,
      revisionCount,
      commentCount,
      mediaStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.entry.count({ where: { tombstonedAt: null } }),
      prisma.revision.count(),
      prisma.comment.count(),
      prisma.media.aggregate({
        _sum: { fileSize: true },
        _count: { id: true },
        where: { status: "READY" }
      }),
    ]);

    return {
      users: userCount,
      entries: entryCount,
      revisions: revisionCount,
      comments: commentCount,
      media: {
        count: mediaStats._count.id,
        totalSize: mediaStats._sum.fileSize || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
