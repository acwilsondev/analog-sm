import { prisma } from "../../infra/prisma.js";
import { type QueryContext } from "./index.js";

export class GetCollectionSummaryQuery {
  async execute(_ctx: QueryContext) {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { entries: true } },
        owner: { select: { id: true, email: true } },
        entries: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            entry: {
              include: {
                revisions: {
                  take: 1,
                  orderBy: { createdAt: "desc" },
                  include: { media: { where: { status: "READY" }, take: 1 } }
                }
              }
            }
          }
        }
      }
    });

    return collections.map(col => ({
      id: col.id,
      name: col.name,
      description: col.description,
      owner: col.owner,
      entryCount: col._count.entries,
      createdAt: col.createdAt,
      coverMedia: col.entries[0]?.entry.revisions[0]?.media[0] || null
    }));
  }
}
