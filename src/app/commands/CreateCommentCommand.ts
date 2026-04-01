import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError, validateComment } from "../../domain/invariants.js";
import type { Comment } from "../../domain/entities.js";

export interface CreateCommentArgs {
  entryId: string;
  parentId?: string;
  content: string;
}

export class CreateCommentCommand extends BaseCommand<CreateCommentArgs, { commentId: string }> {
  async execute(ctx: CommandContext, args: CreateCommentArgs) {
    const entry = await prisma.entry.findUnique({
      where: { id: args.entryId },
    });

    if (!entry) throw new DomainError("Entry not found.");
    if (entry.tombstonedAt) throw new DomainError("Cannot comment on a tombstoned entry.");

    let parent: Comment | undefined;
    if (args.parentId) {
      parent = await prisma.comment.findUnique({
        where: { id: args.parentId }
      }) as any;
      if (!parent) throw new DomainError("Parent comment not found.");
      if (parent.entryId !== args.entryId) throw new DomainError("Parent comment belongs to a different entry.");
    }

    validateComment(ctx.actor, args.content, parent);

    // Mention detection (@email)
    const mentionEmails = Array.from(args.content.matchAll(/@([^\s@]+@[^\s@]+\.[^\s@]+)/g)).map(m => m[1]);
    const mentionedUsers = await prisma.user.findMany({
      where: { email: { in: mentionEmails }, isActive: true },
    });

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          authorId: ctx.actor.id,
          entryId: args.entryId,
          parentId: args.parentId || null,
          content: args.content,
        },
      });

      // Notify entry author
      if (entry.authorId !== ctx.actor.id) {
        await tx.notification.create({
          data: {
            userId: entry.authorId,
            type: "COMMENT",
            data: {
              actorId: ctx.actor.id,
              entryId: entry.id,
              commentId: c.id,
            },
          },
        });
      }

      // Notify parent comment author
      if (parent && parent.authorId !== ctx.actor.id && parent.authorId !== entry.authorId) {
        await tx.notification.create({
          data: {
            userId: parent.authorId,
            type: "REPLY",
            data: {
              actorId: ctx.actor.id,
              entryId: entry.id,
              commentId: c.id,
              parentId: parent.id,
            },
          },
        });
      }

      // Notify mentioned users
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== ctx.actor.id && mentionedUser.id !== entry.authorId && (parent ? mentionedUser.id !== parent.authorId : true)) {
          await tx.notification.create({
            data: {
              userId: mentionedUser.id,
              type: "MENTION",
              data: {
                actorId: ctx.actor.id,
                entryId: entry.id,
                commentId: c.id,
              },
            },
          });
        }
      }

      await this.logAction(ctx, "CREATE_COMMENT", { commentId: c.id, entryId: args.entryId });
      return c;
    });

    return { commentId: comment.id };
  }
}
