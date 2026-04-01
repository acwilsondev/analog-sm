import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface UpdateUserRoleArgs {
  userId: string;
  role: "admin" | "member";
}

export class UpdateUserRoleCommand extends BaseCommand<UpdateUserRoleArgs, void> {
  async execute(ctx: CommandContext, args: UpdateUserRoleArgs) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can update user roles.");
    }

    const user = await prisma.user.findUnique({
      where: { id: args.userId },
    });

    if (!user) throw new DomainError("User not found.");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: args.userId },
        data: { role: args.role },
      });

      await this.logAction(ctx, "UPDATE_USER_ROLE", { userId: args.userId, newRole: args.role });
    });
  }
}
