import { prisma } from "../../infra/prisma.js";
import { type QueryContext } from "./index.js";
import { DomainError } from "../../domain/invariants.js";

export class ListInvitesQuery {
  async execute(ctx: QueryContext) {
    if (ctx.actor.role !== "admin") {
      throw new DomainError("Only admins can list invites.");
    }

    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
    });

    return invites;
  }
}
