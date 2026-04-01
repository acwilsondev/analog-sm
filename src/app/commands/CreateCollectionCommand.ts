import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface CreateCollectionArgs {
  name: string;
  description?: string;
}

export class CreateCollectionCommand extends BaseCommand<CreateCollectionArgs, { collectionId: string }> {
  async execute(ctx: CommandContext, args: CreateCollectionArgs) {
    if (!ctx.actor.isActive) {
      throw new DomainError("Inactive users cannot create collections.");
    }

    if (!args.name || args.name.trim().length === 0) {
      throw new DomainError("Collection name cannot be empty.");
    }

    const collection = await prisma.$transaction(async (tx) => {
      const col = await tx.collection.create({
        data: {
          name: args.name,
          description: args.description,
          ownerId: ctx.actor.id,
        },
      });

      await this.logAction(ctx, "CREATE_COLLECTION", { collectionId: col.id });

      return col;
    });

    return { collectionId: collection.id };
  }
}
