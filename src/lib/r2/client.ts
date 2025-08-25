import { S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

export const bucketName = process.env.R2_BUCKET_NAME!
export const publicDomain = process.env.R2_PUBLIC_DOMAIN!

// Multipart upload utilities
export async function signPutUrl(key: string, contentType: string, expires = 900) {
  const cmd = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(r2Client, cmd, { expiresIn: expires });
  return url;
}

export async function initiateMultipart(key: string, contentType?: string, metadata?: Record<string, string>) {
  const cmd = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Metadata: metadata,
  });
  const res = await r2Client.send(cmd);
  return { uploadId: res.UploadId! };
}

export async function signPartUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expires = 900
) {
  const cmd = new UploadPartCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  const url = await getSignedUrl(r2Client, cmd, { expiresIn: expires });
  return url;
}

export async function completeMultipart(
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
) {
  const cmd = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
  });
  const res = await r2Client.send(cmd);
  return res;
}

export async function abortMultipart(key: string, uploadId: string) {
  const cmd = new AbortMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
  });
  await r2Client.send(cmd);
}