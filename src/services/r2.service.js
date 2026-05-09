import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, s3ClientPublic } from "../config/r2.js";
import { R2_BUCKET, R2_BUCKET_PUBLIC } from "../config/env.js";
import { v4 as uuid } from "uuid";

// Start Multipart Upload
export const startMultipartUpload = async (fileName, fileType, userId) => {
  const key = `uploads/${userId}/${uuid()}/${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  await s3Client.send(command);

  return {
    key,
  };
};

// Generate Pre-Signed URLs (for each part)
export const getMultipartPresignedUrls = async (key, partsCount) => {
  const urls = [];

  for (let partNumber = 1; partNumber <= partsCount; partNumber++) {
    const command = new UploadPartCommand({
      Bucket: R2_BUCKET,
      Key: key,
      PartNumber: partNumber,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    urls.push({
      partNumber,
      url,
    });
  }

  return urls;
};

// Complete Multipart Upload
export const completeMultipartUpload = async (key, parts) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    MultipartUpload: {
      Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber), // [{ ETag, PartNumber }]
    },
  });

  return await s3Client.send(command);
};

// Abort Multipart Uploads
export const abortMultipartUpload = async (key) => {
  await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  );

  return true;
};

// Delete Upload
export const deleteUpload = async (key) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  );

  return true;
};

// Generate a short-lived presigned URL for streaming a private R2 object
export const getStreamPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    // Tell the browser to render it inline (important for video/audio streaming)
    ResponseContentDisposition: "inline",
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
};

// Upload Public File To R2
export const uploadPublicFileToR2 = async (file, userId) => {
  const key = `assets/${userId}/${file.originalname}`;
  const fileType = file.mimetype;
  const fileBuffer = file.buffer;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_PUBLIC,
    Key: key,
    Body: fileBuffer,
    ContentType: fileType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const data = await s3ClientPublic.send(command);

  return {
    key,
    ...data,
  };
};

// Download File from R2
export const getDownloadUrl = async (key, expiresIn = 60 * 60 * 24 * 7) => {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_PUBLIC,
    Key: key,
  });

  const url = await getSignedUrl(s3ClientPublic, command, { expiresIn });
  return url;
};
