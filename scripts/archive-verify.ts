import { prisma } from "../src/infra/prisma.js";
import { VerifyMediaCommand } from "../src/app/commands/VerifyMediaCommand.js";

const main = async () => {
  const admin = await prisma.user.findFirst({
    where: { role: "admin", isActive: true },
  });

  if (!admin) {
    console.error("No active admin found to run verification.");
    process.exit(1);
  }

  console.log("Starting media integrity verification...");
  const cmd = new VerifyMediaCommand();
  // @ts-expect-error type mismatch
  const result = await cmd.execute({ actor: admin, ip: "127.0.0.1" });

  console.log("Verification complete.");
  console.log(`Total:   ${result.total}`);
  console.log(`Valid:   ${result.valid}`);
  console.log(`Corrupt: ${result.corrupt}`);
  console.log(`Missing: ${result.missing}`);

  if (result.details.length > 0) {
    console.log("\nIssues detected:");
    console.table(result.details);
  }
};

main().catch(console.error).finally(() => prisma.$disconnect());
