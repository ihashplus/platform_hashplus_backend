import { file, z } from "zod";
import mongoose from "mongoose";

const isObjectId = (schema, fieldName = "ID") =>
  schema.refine(
    (value) => mongoose.isValidObjectId(value),
    `${fieldName} must be a valid MongoDB ID`,
  );

export const startUploadSchema = z.object({
  body: z
    .object({
      fileName: z.string().trim(),
      fileType: z.string().trim(),
      userId: isObjectId(z.string(), "userId"),
      partsCount: z.coerce.number().int().min(1).max(10000),
    })
    .strict(),
});

export const completeUploadSchema = z.object({
  body: z
    .object({
      key: z.string().trim(),
      parts: z
        .array(
          z.object({
            PartNumber: z.coerce.number().int().min(1).max(10000),
            ETag: z.string().trim(),
          }),
        )
        .min(1),
    })
    .strict(),
});

export const removeUploadSchema = z.object({
  body: z
    .object({
      key: z.string().trim(),
    })
    .strict(),
});

// Schema for generating a streaming presigned URL
export const streamUrlSchema = z.object({
  params: z
    .object({
      contentId: z.string().trim().optional(),
    })
    .strict(),
  body: z
    .object({
      key: z.string().trim().min(1, "key is required"),
      expiresIn: z.coerce.number().int().min(1).max(21600).optional(), // 1s – 6h
    })
    .strict(),
});

export const uploadAssetSchema = z.object({
  body: z
    .object({
      folder: z.string().trim().optional(),
    })
    .strict(),
});
