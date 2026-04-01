import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError, canUpdateEntry } from "../../domain/invariants.js";

export interface EditEntryArgs {
  entryId: string;
  content: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export class EditEntryCommand extends BaseCommand<EditEntryArgs, { revisionId: string }> {
  async execute(ctx: CommandContext, args: EditEntryArgs) {
    const entry = await prisma.entry.findUnique({
      where: { id: args.entryId },
    });

    if (!entry) {
      throw new DomainError("Entry not found.");
    }

    if (entry.tombstonedAt) {
      throw new DomainError("Cannot edit a tombstoned entry.");
    }

    // @ts-expect-error type mismatch on joinedAt vs createdAt
    if (!canUpdateEntry(ctx.actor, entry)) {
      throw new DomainError("You do not have permission to edit this entry.");
    }

    if (!args.content || args.content.trim().length === 0) {
      throw new DomainError("Entry content cannot be empty.");
    }

    const revision = await prisma.$transaction(async (tx) => {
      // Upsert tags and replace if provided
      if (args.tags) {
        const tagIds: string[] = [];
        for (const tagName of args.tags) {
          const tag = await tx.tag.upsert({
            where: { name: tagName.toLowerCase() },
            update: {},
            create: { name: tagName.toLowerCase() },
          });
          tagIds.push(tag.id);
        }

        // Delete existing relations and create new ones
        await tx.tagsOnEntries.deleteMany({
          where: { entryId: args.entryId },
        });

        if (tagIds.length > 0) {
          await tx.tagsOnEntries.createMany({
            data: tagIds.map(tagId => ({ entryId: args.entryId, tagId })),
          });
        }
      }

      const rev = await tx.revision.create({
        data: {
          entryId: args.entryId,
          content: args.content,
          metadata: args.metadata,
        },
      });

      await tx.entry.update({
        where: { id: args.entryId },
        data: { updatedAt: new Date() },
      });

      await this.logAction(ctx, "EDIT_ENTRY", { entryId: args.entryId, revisionId: rev.id });

      return rev;
    });

    return { revisionId: revision.id };
  }
}
