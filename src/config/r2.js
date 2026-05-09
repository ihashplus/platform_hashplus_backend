import { S3Client } from "@aws-sdk/client-s3";
import {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_PUBLIC_ACCESS_KEY_ID,
  R2_PUBLIC_SECRET_ACCESS_KEY,
} from "./env.js";

export const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const s3ClientPublic = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_PUBLIC_ACCESS_KEY_ID,
    secretAccessKey: R2_PUBLIC_SECRET_ACCESS_KEY,
  },
});
