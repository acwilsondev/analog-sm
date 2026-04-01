import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface RevokeInviteArgs {
  inviteId: string;
}

export class RevokeInviteCommand extends BaseCommand<RevokeInviteArgs, void> {
  async execute(ctx: CommandContext, args: RevokeInviteArgs) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can revoke invites.");
    }

    const invite = await prisma.invite.findUnique({
      where: { id: args.inviteId },
    });

    if (!invite) throw new DomainError("Invite not found.");

    await prisma.$transaction(async (tx) => {
      await tx.invite.delete({
        where: { id: args.inviteId },
      });

      await this.logAction(ctx, "REVOKE_INVITE", { inviteId: args.inviteId, code: invite.code });
    });
  }
}
