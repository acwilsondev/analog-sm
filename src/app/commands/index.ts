import { prisma } from "../../infra/prisma.js";
import type { Member } from "../../domain/entities.js";

export interface CommandContext {
  actor: Member;
  ip?: string;
}

export abstract class BaseCommand<TArgs, TResult> {
  abstract execute(ctx: CommandContext, args: TArgs): Promise<TResult>;
  
  protected async logAction(ctx: CommandContext, action: string, details?: any) {
    await prisma.auditLog.create({
      data: {
        userId: ctx.actor.id,
        action,
        details,
        ip: ctx.ip,
      },
    });
  }
}
