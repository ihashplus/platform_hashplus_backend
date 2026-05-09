import { z } from "zod";
import mongoose from "mongoose";

const isObjectId = (schema, fieldName = "ID") =>
  schema.refine(
    (value) => mongoose.isValidObjectId(value),
    `${fieldName} must be a valid MongoDB ID`,
  );

const priceSchema = z
  .object({
    amount: z.coerce.number().min(0),
    currency: z.string().trim().default("SAR"),
  })
  .strict();

const materialSchema = z
  .object({
    title: z.string().trim(),
    url: z.url().trim().optional(),
    key: z.string().trim().optional(),
  })
  .strict();

const finalProjectSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10),
    tasks: z.array(z.string().trim()).min(1),
    materials: z.array(materialSchema).optional(),
  })
  .strict();

const welcomeVideoSchema = z
  .object({
    url: z.url().trim().optional(),
    key: z.string().trim(),
    size: z.coerce.number(),
    duration: z.coerce.number(),
  })
  .strict();

const thumbnailSchema = z
  .object({
    url: z.url().trim().optional(),
    key: z.string().trim(),
  })
  .strict();

export const createContentSchema = z.object({
  body: z
    .object({
      contentType: z.enum(["course", "bootcamp"]),
      title: z.string().trim().min(3).max(200),
      category: isObjectId(z.string(), "category"),
      description: z.string().trim().min(10),

      instructor: isObjectId(z.string(), "instructor").optional(),
      learningOutcomes: z.array(z.string().trim()).min(1).optional(),
      prerequisites: z.array(z.string().trim()).min(1).optional(),
      welcomeMessage: z.string().trim().optional(),
      congratulationsMessage: z.string().trim().optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      language: z.enum(["ar", "en", "fr"]).optional(),
      materials: z.array(materialSchema).optional(),
      price: z.union([priceSchema, z.coerce.number().min(0)]).optional(),

      thumbnail: thumbnailSchema.optional(),
      welcomeVideo: welcomeVideoSchema.optional(),
      finalProject: finalProjectSchema.optional(),

      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      totalProjects: z.coerce.number().optional(),
    })
    .refine(
      (data) => {
        if (data.contentType === "bootcamp" && !data.startDate) {
          return false;
        }
        if (data.contentType === "bootcamp" && !data.endDate) {
          return false;
        }
        if (data.contentType === "bootcamp" && !data.totalProjects) {
          return false;
        }
        return true;
      },
      {
        message:
          "startDate, endDate, and totalProjects are required for bootcamp",
        path: ["contentType"],
      },
    )
    .strict(),
});

export const updateContentSchema = z.object({
  body: z
    .object({
      contentType: z.enum(["course", "bootcamp"]),
      title: z.string().trim().min(3).max(200).optional(),
      category: isObjectId(z.string(), "category").optional(),
      description: z.string().trim().min(10).optional(),
      learningOutcomes: z.array(z.string().trim()).min(1).optional(),
      prerequisites: z.array(z.string().trim()).min(1).optional(),
      welcomeMessage: z.string().trim().optional(),
      congratulationsMessage: z.string().trim().optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      language: z.enum(["ar", "en", "fr"]).optional(),
      materials: z.array(materialSchema).optional(),
      price: z.union([priceSchema, z.coerce.number().min(0)]).optional(),

      thumbnail: thumbnailSchema.optional(),
      welcomeVideo: welcomeVideoSchema.optional(),
      finalProject: finalProjectSchema.optional(),

      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      totalProjects: z.coerce.number().optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required",
    ),

  params: z
    .object({
      contentId: isObjectId(z.string(), "contentId"),
    })
    .strict(),
});
