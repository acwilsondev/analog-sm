import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export interface MarkNotificationReadArgs {
  notificationId: string;
}

export class MarkNotificationReadCommand extends BaseCommand<MarkNotificationReadArgs, void> {
  async execute(ctx: CommandContext, args: MarkNotificationReadArgs) {
    const notification = await prisma.notification.findUnique({
      where: { id: args.notificationId },
    });

    if (!notification) throw new DomainError("Notification not found.");
    if (notification.userId !== ctx.actor.id) {
      throw new DomainError("You can only mark your own notifications as read.");
    }

    if (notification.readAt) return;

    await prisma.notification.update({
      where: { id: args.notificationId },
      data: { readAt: new Date() },
    });
  }
}
