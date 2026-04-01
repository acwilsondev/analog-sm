import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface ModerationDeleteEntryArgs {
  entryId: string;
}

export class ModerationDeleteEntryCommand extends BaseCommand<ModerationDeleteEntryArgs, void> {
  async execute(ctx: CommandContext, args: ModerationDeleteEntryArgs) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can perform moderation deletes.");
    }

    const entry = await prisma.entry.findUnique({
      where: { id: args.entryId },
    });

    if (!entry) throw new DomainError("Entry not found.");

    await prisma.$transaction(async (tx) => {
      // Cascading deletes handled by schema, but we log explicitly
      await tx.entry.delete({
        where: { id: args.entryId },
      });

      await this.logAction(ctx, "MODERATION_DELETE_ENTRY", { entryId: args.entryId });
    });
  }
}
