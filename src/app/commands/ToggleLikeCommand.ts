import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface ToggleLikeArgs {
  entryId: string;
}

export class ToggleLikeCommand extends BaseCommand<ToggleLikeArgs, { liked: boolean }> {
  async execute(ctx: CommandContext, args: ToggleLikeArgs) {
    if (!ctx.actor.isActive) {
      throw new DomainError("Inactive users cannot like entries.");
    }

    const entry = await prisma.entry.findUnique({
      where: { id: args.entryId },
      include: { author: true }
    });

    if (!entry) throw new DomainError("Entry not found.");
    if (entry.tombstonedAt) throw new DomainError("Cannot like a tombstoned entry.");

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_entryId: {
          userId: ctx.actor.id,
          entryId: args.entryId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.like.delete({
          where: {
            userId_entryId: {
              userId: ctx.actor.id,
              entryId: args.entryId,
            },
          },
        }),
        this.logAction(ctx, "UNLIKE_ENTRY", { entryId: args.entryId }),
      ]);
      return { liked: false };
    } else {
      // Like
      await prisma.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId: ctx.actor.id,
            entryId: args.entryId,
          },
        });

        // Notify author if it's not themselves
        if (entry.authorId !== ctx.actor.id) {
          await tx.notification.create({
            data: {
              userId: entry.authorId,
              type: "LIKE",
              data: {
                actorId: ctx.actor.id,
                entryId: entry.id,
              },
            },
          });
        }

        await this.logAction(ctx, "LIKE_ENTRY", { entryId: args.entryId });
      });
      return { liked: true };
    }
  }
}
