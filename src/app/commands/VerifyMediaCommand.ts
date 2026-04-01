import { prisma } from "../../infra/prisma.js";
import { BaseCommand, type CommandContext } from "./index.js";
import { getObjectStream, calculateChecksum } from "../../infra/storage.js";
import { readConfig } from "../../infra/config.js";

const cfg = readConfig();

export interface VerifyMediaResult {
  total: number;
  valid: number;
  missing: number;
  corrupt: number;
  details: { mediaId: string; s3Key: string; error: string }[];
}

export class VerifyMediaCommand extends BaseCommand<void, VerifyMediaResult> {
  async execute(ctx: CommandContext) {
    const mediaList = await prisma.media.findMany({
      where: { status: "READY" },
    });

    const result: VerifyMediaResult = {
      total: mediaList.length,
      valid: 0,
      missing: 0,
      corrupt: 0,
      details: [],
    };

    for (const m of mediaList) {
      try {
        const stream = await getObjectStream(cfg, m.s3Key);
        const actualChecksum = await calculateChecksum(stream);

        if (actualChecksum === m.sha256) {
          result.valid++;
        } else {
          result.corrupt++;
          result.details.push({
            mediaId: m.id,
            s3Key: m.s3Key,
            error: `Checksum mismatch. Expected ${m.sha256}, got ${actualChecksum}`,
          });
        }
      } catch (error: any) {
        if (error.name === "NoSuchKey") {
          result.missing++;
          result.details.push({
            mediaId: m.id,
            s3Key: m.s3Key,
            error: "File missing in storage",
          });
        } else {
          result.details.push({
            mediaId: m.id,
            s3Key: m.s3Key,
            error: `Storage error: ${error.message}`,
          });
        }
      }
    }

    await this.logAction(ctx, "VERIFY_MEDIA_INTEGRITY", { 
      total: result.total, 
      valid: result.valid, 
      corrupt: result.corrupt, 
      missing: result.missing 
    });

    return result;
  }
}
