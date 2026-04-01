import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError, canUpdateEntry } from "../../domain/invariants.js";

export interface AttachMediaArgs {
  mediaId: string;
  revisionId: string;
}

export class AttachMediaCommand extends BaseCommand<AttachMediaArgs, { mediaId: string }> {
  async execute(ctx: CommandContext, args: AttachMediaArgs) {
    const revision = await prisma.revision.findUnique({
      where: { id: args.revisionId },
      include: { entry: true },
    });

    if (!revision) {
      throw new DomainError("Revision not found.");
    }

    if (revision.entry.tombstonedAt) {
      throw new DomainError("Cannot attach media to a tombstoned entry.");
    }

    // @ts-expect-error type mismatch on joinedAt vs createdAt
    if (!canUpdateEntry(ctx.actor, revision.entry)) {
      throw new DomainError("You do not have permission to modify this entry.");
    }

    const media = await prisma.media.findUnique({
      where: { id: args.mediaId },
    });

    if (!media) {
      throw new DomainError("Media not found.");
    }

    if (media.status !== "READY") {
      throw new DomainError("Only READY media can be attached.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.media.update({
        where: { id: args.mediaId },
        data: { revisionId: args.revisionId },
      });

      await this.logAction(ctx, "ATTACH_MEDIA", { mediaId: args.mediaId, revisionId: args.revisionId });
    });

    return { mediaId: args.mediaId };
  }
}
