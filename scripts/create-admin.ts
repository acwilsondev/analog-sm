import crypto from "node:crypto";
import { readConfig } from "../src/infra/config.js";
import { createPgClient } from "../src/infra/postgres.js";

const main = async (): Promise<void> => {
  const cfg = readConfig();
  const email = process.argv[2];
  const token = process.argv[3];

  if (!email || !token) {
    throw new Error("Usage: npm run create-admin -- <email> <bootstrap-token>");
  }

  if (token !== cfg.ADMIN_BOOTSTRAP_TOKEN) {
    throw new Error("Invalid bootstrap token");
  }

  const client = createPgClient(cfg);
  await client.connect();
  try {
    await client.query("BEGIN");
    const usedCheck = await client.query(
      'SELECT "bootstrapUsedAt" FROM "BootstrapState" WHERE id = 1 FOR UPDATE'
    );

    if (usedCheck.rows[0]?.bootstrapUsedAt) {
      throw new Error("Bootstrap already completed");
    }

    await client.query(
      'INSERT INTO "Member" (id, email, role, "createdAt") VALUES ($1, $2, $3, NOW())',
      [crypto.randomUUID(), email, "admin"]
    );
    await client.query(
      'UPDATE "BootstrapState" SET "bootstrapUsedAt" = NOW() WHERE id = 1'
    );
    await client.query("COMMIT");
    console.log(`Admin created for ${email}. Bootstrap token is now disabled.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
