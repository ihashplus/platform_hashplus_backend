import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/r2.js";
import { R2_BUCKET } from "../config/env.js";
import { v4 as uuid } from "uuid";

// Start Multipart Upload
export const startMultipartUpload = async (fileName, fileType, userId) => {
  const key = `uploads/${userId}/${uuid()}/${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const response = await s3Client.send(command);

  return {
    uploadId: response.UploadId,
    key,
  };
};

// Generate Pre-Signed URLs (for each part)
export const getMultipartPresignedUrls = async (key, uploadId, partsCount) => {
  const urls = [];

  for (let partNumber = 1; partNumber <= partsCount; partNumber++) {
    const command = new UploadPartCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: uploadId,
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
export const completeMultipartUpload = async (key, uploadId, parts) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber), // [{ ETag, PartNumber }]
    },
  });

  return await s3Client.send(command);
};

// Abort Multipart Uploads
export const abortMultipartUpload = async (key, uploadId) => {
  await s3Client.send(
    new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: uploadId,
    }),
  );

  return true;
};

// Delete Upload
export const deleteUpload = async (key, uploadId) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: uploadId,
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

// Cleanup job — runs every 24h
export const abortStaleMultipartUploads = async () => {
  const stale = await db.videos.findAll({
    status: "pending",
    createdAt: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) }, // older than 48h
  });

  for (const video of stale) {
    if (!video.uploadId) continue;
    await r2.send(
      new AbortMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: video.key,
        UploadId: video.uploadId,
      }),
    );
    await db.videos.update(video.id, { status: "expired" });
  }
};
