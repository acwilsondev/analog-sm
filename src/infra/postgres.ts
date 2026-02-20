import { Client } from "pg";
import type { AppConfig } from "./config.js";

export const createPgClient = (cfg: AppConfig): Client => {
  return new Client({
    host: cfg.PGHOST,
    port: cfg.PGPORT,
    user: cfg.PGUSER,
    password: cfg.PGPASSWORD,
    database: cfg.PGDATABASE
  });
};

export const checkPgReadiness = async (cfg: AppConfig): Promise<boolean> => {
  const client = createPgClient(cfg);
  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
};
