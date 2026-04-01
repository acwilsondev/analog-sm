import { prisma } from "../../infra/prisma.js";
import { type QueryContext, type PaginatedResult, type PaginationArgs } from "./index.js";

export interface GetMediaGridArgs extends PaginationArgs {
  mimeTypePrefix?: string; // e.g. "image/"
}

export class GetMediaGridQuery {
  async execute(_ctx: QueryContext, args: GetMediaGridArgs): Promise<PaginatedResult<any>> {
    const limit = args.limit || 20;
    const cursor = args.cursor;

    const media = await prisma.media.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        status: "READY",
        mimeType: args.mimeTypePrefix ? { startsWith: args.mimeTypePrefix } : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        revision: {
          include: { entry: true }
        }
      }
    });

    let nextCursor: string | undefined = undefined;
    if (media.length > limit) {
      const nextItem = media.pop();
      nextCursor = nextItem?.id;
    }

    return {
      data: media,
      nextCursor,
    };
  }
}
