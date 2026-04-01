import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError, canUpdateEntry } from "../../domain/invariants.js";

export interface TombstoneEntryArgs {
  entryId: string;
}

export class TombstoneEntryCommand extends BaseCommand<TombstoneEntryArgs, { entryId: string }> {
  async execute(ctx: CommandContext, args: TombstoneEntryArgs) {
    const entry = await prisma.entry.findUnique({
      where: { id: args.entryId },
    });

    if (!entry) {
      throw new DomainError("Entry not found.");
    }

    if (entry.tombstonedAt) {
      return { entryId: entry.id };
    }

    // @ts-expect-error type mismatch on joinedAt vs createdAt
    if (!canUpdateEntry(ctx.actor, entry)) {
      throw new DomainError("You do not have permission to delete this entry.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.entry.update({
        where: { id: args.entryId },
        data: { tombstonedAt: new Date() },
      });

      await this.logAction(ctx, "TOMBSTONE_ENTRY", { entryId: args.entryId });
    });

    return { entryId: args.entryId };
  }
}
