CREATE TABLE IF NOT EXISTS "Member" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "BootstrapState" (
  "id" INTEGER PRIMARY KEY,
  "bootstrapUsedAt" TIMESTAMP
);

INSERT INTO "BootstrapState" ("id", "bootstrapUsedAt") VALUES (1, NULL)
ON CONFLICT ("id") DO NOTHING;
