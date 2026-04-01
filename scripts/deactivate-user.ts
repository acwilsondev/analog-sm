import { prisma } from "../src/infra/prisma.js";
import { ToggleUserStatusCommand } from "../src/app/commands/ToggleUserStatusCommand.js";

const main = async (): Promise<void> => {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npm run deactivate-user -- <email>");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User with email ${email} not found.`);

  const admin = await prisma.user.findFirst({
    where: { role: "admin", isActive: true },
  });

  if (!admin) {
    throw new Error("No active admin found to perform deactivation.");
  }

  const cmd = new ToggleUserStatusCommand();
  await cmd.execute(
    { actor: admin as any, ip: "127.0.0.1" },
    { userId: user.id, isActive: false }
  );

  console.log(`User ${email} deactivated.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
