import { z } from "zod";
import mongoose from "mongoose";

const isObjectId = (schema, fieldName = "ID") =>
  schema.refine(
    (value) => mongoose.isValidObjectId(value),
    `${fieldName} must be a valid MongoDB ID`,
  );

export const updateProgressSchema = z.object({
  body: z
    .object({
      progress: z.coerce.number().min(0).max(100),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  params: z
    .object({
      contentId: isObjectId(z.string(), "contentId"),
    })
    .strict(),
});
