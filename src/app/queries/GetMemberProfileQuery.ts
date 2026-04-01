import { prisma } from "../../infra/prisma.js";
import { type QueryContext, type PaginatedResult, type PaginationArgs } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface GetMemberProfileArgs extends PaginationArgs {
  memberId: string;
}

export class GetMemberProfileQuery {
  async execute(_ctx: QueryContext, args: GetMemberProfileArgs): Promise<{ member: any; entries: PaginatedResult<any> }> {
    const member = await prisma.user.findUnique({
      where: { id: args.memberId },
      select: {
        id: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: { entries: { where: { tombstonedAt: null } } }
        }
      }
    });

    if (!member) throw new DomainError("Member not found");

    const limit = args.limit || 20;
    const cursor = args.cursor;

    const entries = await prisma.entry.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: { 
        authorId: args.memberId,
        tombstonedAt: null 
      },
      orderBy: { createdAt: "desc" },
      include: {
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
      member,
      entries: {
        data: entries,
        nextCursor,
      }
    };
  }
}
