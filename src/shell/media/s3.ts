import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for Minio
});

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const bucket = process.env.S3_BUCKET!;
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: file,
      ContentType: contentType,
    })
  );

  const publicBase = process.env.S3_PUBLIC_URL ?? process.env.S3_ENDPOINT;
  return `${publicBase}/${bucket}/${fileName}`;
}
