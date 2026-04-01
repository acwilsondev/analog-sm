import { 
  HeadBucketCommand, 
  S3Client, 
  PutObjectCommand, 
  CreateMultipartUploadCommand, 
  UploadPartCommand, 
  CompleteMultipartUploadCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AppConfig } from "./config.js";
import { Readable } from "node:stream";
import crypto from "node:crypto";

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

export const getPresignedUploadUrl = async (
  cfg: AppConfig,
  key: string,
  contentType: string,
  expiresInSeconds = 900
): Promise<string> => {
  const client = createS3Client(cfg);
  const command = new PutObjectCommand({
    Bucket: cfg.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
};

export const initMultipartUpload = async (
  cfg: AppConfig,
  key: string,
  contentType: string
): Promise<string> => {
  const client = createS3Client(cfg);
  const command = new CreateMultipartUploadCommand({
    Bucket: cfg.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const response = await client.send(command);
  return response.UploadId!;
};

export const getPresignedPartUrl = async (
  cfg: AppConfig,
  key: string,
  uploadId: string,
  partNumber: number,
  expiresInSeconds = 900
): Promise<string> => {
  const client = createS3Client(cfg);
  const command = new UploadPartCommand({
    Bucket: cfg.S3_BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
};

export const completeMultipartUpload = async (
  cfg: AppConfig,
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
): Promise<void> => {
  const client = createS3Client(cfg);
  const command = new CompleteMultipartUploadCommand({
    Bucket: cfg.S3_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  await client.send(command);
};

export const getObjectStream = async (cfg: AppConfig, key: string): Promise<Readable> => {
  const client = createS3Client(cfg);
  const command = new GetObjectCommand({
    Bucket: cfg.S3_BUCKET,
    Key: key,
  });
  const response = await client.send(command);
  return response.Body as Readable;
};

export const calculateChecksum = async (stream: Readable): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
};
