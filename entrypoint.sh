#!/bin/sh
set -e

# Fail loudly if critical secrets are missing or using known placeholder values
case "${NEXTAUTH_SECRET}" in
  ""|"placeholder-secret"|"your-secret-here"|"your-random-secret-here"|"changeme"|"secret")
    echo "ERROR: NEXTAUTH_SECRET is not set or is using a known placeholder value."
    echo "  Generate a secret with: openssl rand -hex 32"
    exit 1
    ;;
esac

echo "Waiting for postgres to be ready..."
until node -e "const net = require('net'); const client = net.createConnection({ port: 5432, host: 'postgres' }, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1));" > /dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Running database migrations..."
./node_modules/.bin/prisma db push

echo "Ensuring S3 bucket exists..."
node -e "
const { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'auto',
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
  forcePathStyle: true,
});
const bucket = process.env.S3_BUCKET;
const publicPolicy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: 'arn:aws:s3:::' + bucket + '/*' }],
});
async function ensureBucket() {
  try { await client.send(new HeadBucketCommand({ Bucket: bucket })); console.log('Bucket already exists:', bucket); }
  catch { await client.send(new CreateBucketCommand({ Bucket: bucket })); console.log('Bucket created:', bucket); }
  await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: publicPolicy }));
  console.log('Bucket policy set to public-read');
}
ensureBucket().catch(e => console.error('S3 setup failed:', e.message));
"

echo "Starting application..."
exec node server.js
