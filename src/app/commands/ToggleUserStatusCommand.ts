import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface ToggleUserStatusArgs {
  userId: string;
  isActive: boolean;
}

export class ToggleUserStatusCommand extends BaseCommand<ToggleUserStatusArgs, void> {
  async execute(ctx: CommandContext, args: ToggleUserStatusArgs) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can toggle user status.");
    }

    if (ctx.actor.id === args.userId && !args.isActive) {
      throw new DomainError("Admins cannot deactivate themselves.");
    }

    const user = await prisma.user.findUnique({
      where: { id: args.userId },
    });

    if (!user) throw new DomainError("User not found.");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: args.userId },
        data: { isActive: args.isActive },
      });

      await this.logAction(ctx, "TOGGLE_USER_STATUS", { userId: args.userId, isActive: args.isActive });
    });
  }
}
