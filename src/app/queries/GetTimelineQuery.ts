import { prisma } from "../../infra/prisma.js";
import { type QueryContext, type PaginatedResult, type PaginationArgs } from "./index.js";

export interface GetTimelineArgs extends PaginationArgs {}

export class GetTimelineQuery {
  async execute(_ctx: QueryContext, args: GetTimelineArgs): Promise<PaginatedResult<any>> {
    const limit = args.limit || 20;
    const cursor = args.cursor;

    const entries = await prisma.entry.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: { tombstonedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, email: true } },
        revisions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { media: { where: { status: "READY" } } }
        },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true } }
      },
    });

    let nextCursor: string | undefined = undefined;
    if (entries.length > limit) {
      const nextItem = entries.pop();
      nextCursor = nextItem?.id;
    }

    return {
      data: entries,
      nextCursor,
    };
  }
}
