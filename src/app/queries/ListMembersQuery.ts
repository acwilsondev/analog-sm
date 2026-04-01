import { prisma } from "../../infra/prisma.js";
import { type QueryContext, type PaginatedResult, type PaginationArgs } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface ListMembersArgs extends PaginationArgs {
  isActive?: boolean;
}

export class ListMembersQuery {
  async execute(ctx: QueryContext, args: ListMembersArgs): Promise<PaginatedResult<any>> {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can list members.");
    }

    const limit = args.limit || 50;
    const cursor = args.cursor;

    const users = await prisma.user.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        isActive: args.isActive !== undefined ? args.isActive : undefined,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { entries: { where: { tombstonedAt: null } } }
        }
      }
    });

    let nextCursor: string | undefined = undefined;
    if (users.length > limit) {
      const nextItem = users.pop();
      nextCursor = nextItem?.id;
    }

    return {
      data: users,
      nextCursor,
    };
  }
}
