import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface CreateEntryArgs {
  content: string;
  metadata?: Record<string, any>;
  collectionIds?: string[];
  tags?: string[];
}

export class CreateEntryCommand extends BaseCommand<CreateEntryArgs, { entryId: string; revisionId: string }> {
  async execute(ctx: CommandContext, args: CreateEntryArgs) {
    if (!ctx.actor.isActive) {
      throw new DomainError("Inactive users cannot create entries.");
    }

    if (!args.content || args.content.trim().length === 0) {
      throw new DomainError("Entry content cannot be empty.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert tags first
      const tagIds: string[] = [];
      if (args.tags && args.tags.length > 0) {
        for (const tagName of args.tags) {
          const tag = await tx.tag.upsert({
            where: { name: tagName.toLowerCase() },
            update: {},
            create: { name: tagName.toLowerCase() },
          });
          tagIds.push(tag.id);
        }
      }

      const entry = await tx.entry.create({
        data: {
          authorId: ctx.actor.id,
          revisions: {
            create: {
              content: args.content,
              metadata: args.metadata,
            },
          },
          collections: args.collectionIds?.length 
            ? {
                create: args.collectionIds.map(id => ({
                  collection: { connect: { id } }
                }))
              }
            : undefined,
          tags: tagIds.length 
            ? {
                create: tagIds.map(id => ({
                  tag: { connect: { id } }
                }))
              }
            : undefined,
        },
        include: {
          revisions: true,
        },
      });

      const revisionId = entry.revisions[0].id;

      await this.logAction(ctx, "CREATE_ENTRY", { entryId: entry.id, revisionId });

      return { entryId: entry.id, revisionId };
    });

    return result;
  }
}
