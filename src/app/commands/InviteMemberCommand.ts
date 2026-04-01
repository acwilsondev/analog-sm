import crypto from "node:crypto";
import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface InviteMemberArgs {
  email?: string;
  role: "admin" | "member";
  maxUses?: number;
}

export class InviteMemberCommand extends BaseCommand<InviteMemberArgs, { inviteId: string; code: string }> {
  async execute(ctx: CommandContext, args: InviteMemberArgs) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can invite members.");
    }

    const code = crypto.randomBytes(16).toString("hex");

    const invite = await prisma.$transaction(async (tx) => {
      const inv = await tx.invite.create({
        data: {
          code,
          email: args.email || null,
          role: args.role,
          createdBy: ctx.actor.id,
          maxUses: args.maxUses || 1,
        },
      });

      await this.logAction(ctx, "INVITE_MEMBER", { inviteId: inv.id, role: args.role });

      return inv;
    });

    return { inviteId: invite.id, code: invite.code };
  }
}
