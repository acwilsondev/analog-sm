import { prisma } from "../../infra/prisma.js";
import { type QueryContext, type PaginatedResult, type PaginationArgs } from "./index.js";

export interface SearchEntriesArgs extends PaginationArgs {
  query: string;
}

export class SearchEntriesQuery {
  async execute(_ctx: QueryContext, args: SearchEntriesArgs): Promise<PaginatedResult<any>> {
    const limit = args.limit || 20;
    const cursor = args.cursor;

    // We search across revisions. Simple ILIKE for v1.
    const entries = await prisma.entry.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        tombstonedAt: null,
        revisions: {
          some: {
            content: {
              contains: args.query,
              mode: 'insensitive'
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, email: true } },
        revisions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { media: { where: { status: "READY" } } }
        },
        tags: { include: { tag: true } },
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
