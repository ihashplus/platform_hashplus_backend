import { z } from "zod";
import mongoose from "mongoose";

const isObjectId = (schema, fieldName = "ID") =>
  schema.refine(
    (value) => mongoose.isValidObjectId(value),
    `${fieldName} must be a valid MongoDB ID`,
  );

export const moduleIdSchema = z
  .object({
    moduleId: isObjectId(z.string(), "moduleId"),
  })
  .strict();

export const getAllSubmissionsSchema = z.object({
  params: z
    .object({
      contentId: isObjectId(z.string(), "contentId").optional(),
    })
    .strict(),
  query: z
    .object({
      submissionType: z
        .enum(["quizSubmission", "taskSubmission", "finalProjectSubmission"])
        .optional(),
    })
    .strict(),
});

export const submitQuizSchema = z.object({
  body: z
    .object({
      data: z
        .array(
          z.object({
            question: z.string().trim().min(3).max(100),
            answer: z.string().trim().min(3).max(100),
          }),
        )
        .min(1),
    })
    .strict(),
  params: z
    .object({
      contentId: isObjectId(z.string(), "contentId"),
      sectionId: isObjectId(z.string(), "sectionId"),
      moduleId: isObjectId(z.string(), "moduleId"),
    })
    .strict(),
});

export const submitTaskSchema = z.object({
  body: z
    .object({
      url: z.url().trim().optional(),
      image: z
        .object({
          key: z.string().trim(),
          url: z.url().trim(),
          uploadId: z.string().trim(),
        })
        .optional(),
      description: z.string().trim().optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one task submission is required",
    ),
  params: z
    .object({
      contentId: isObjectId(z.string(), "contentId"),
      sectionId: isObjectId(z.string(), "sectionId"),
      moduleId: isObjectId(z.string(), "moduleId"),
    })
    .strict(),
});

export const submitFinalProjectSchema = z.object({
  body: z
    .object({
      links: z.array(z.url().trim()).min(1),
      notes: z.string().trim().optional(),
    })
    .strict(),

  params: z
    .object({
      contentId: isObjectId(z.string(), "contentId"),
    })
    .strict(),
});

export const feedbackOnFinalProjectSchema = z.object({
  body: z
    .object({
      status: z.enum(["approved", "rejected"]).optional(),
      feedback: z.string().trim().optional(),
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
