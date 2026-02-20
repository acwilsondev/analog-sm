import express from "express";
import { readConfig } from "../infra/config.js";
import { checkPgReadiness } from "../infra/postgres.js";
import { checkStorageReadiness } from "../infra/storage.js";

const cfg = readConfig();
const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/ready", async (_req, res) => {
  const [dbReady, storageReady] = await Promise.all([
    checkPgReadiness(cfg),
    checkStorageReadiness(cfg)
  ]);

  if (!dbReady || !storageReady) {
    res.status(503).json({ status: "not_ready", details: { dbReady, storageReady } });
    return;
  }

  res.status(200).json({ status: "ready", details: { dbReady, storageReady }});
});

app.listen(cfg.PORT, () => {
  console.log(`Analog app listening on :${cfg.PORT} (${cfg.INSTANCE_NAME})`);
});
