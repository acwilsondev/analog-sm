import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import type { AppConfig } from "./config.js";

export const createS3Client = (cfg: AppConfig): S3Client =>
  new S3Client({
    endpoint: cfg.S3_ENDPOINT,
    region: cfg.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: cfg.S3_ACCESS_KEY,
      secretAccessKey: cfg.S3_SECRET_KEY
    }
  });

export const checkStorageReadiness = async (cfg: AppConfig): Promise<boolean> => {
  const client = createS3Client(cfg);
  try {
    await client.send(new HeadBucketCommand({ Bucket: cfg.S3_BUCKET }));
    return true;
  } catch {
    return false;
  }
};
