import { prisma } from "../src/infra/prisma.js";
import { InviteMemberCommand } from "../src/app/commands/InviteMemberCommand.js";

const main = async (): Promise<void> => {
  const email = process.argv[2];
  const role = (process.argv[3] || "member") as "admin" | "member";
  
  // Find an admin to act as the creator
  const admin = await prisma.user.findFirst({
    where: { role: "admin", isActive: true },
  });

  if (!admin) {
    throw new Error("No active admin found to create invite.");
  }

  const cmd = new InviteMemberCommand();
  const result = await cmd.execute(
    { actor: admin as any, ip: "127.0.0.1" },
    { email, role, maxUses: 1 }
  );

  console.log(`Invite created!`);
  console.log(`Code: ${result.code}`);
  if (email) console.log(`Target: ${email}`);
  console.log(`Role: ${role}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
