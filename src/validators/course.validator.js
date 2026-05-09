import { z } from "zod";
import mongoose from "mongoose";

const isObjectId = (schema, fieldName = "ID") =>
  schema.refine(
    (value) => mongoose.isValidObjectId(value),
    `${fieldName} must be a valid MongoDB ID`,
  );

export const sectionAndModuleParamsSchema = z.object({
  params: z.object({
    sectionId: isObjectId(z.string(), "sectionId"),
    moduleId: isObjectId(z.string(), "moduleId"),
  }),
});

// video Data
const videoDataSchema = z.object({
  url: z.url().trim().optional(),
  size: z.coerce.number(),
  duration: z.coerce.number(),
  key: z.string().trim(),
});

// Quiz Data
const quizDataSchema = z.array(
  z
    .object({
      question: z.string().trim().min(3).max(100),
      options: z.array(z.string().trim().min(3).max(100)),
      answer: z.string().trim().min(3).max(100),
    })
    .refine((data) => data.options.length >= 2, {
      message: "Options must be at least two",
      path: ["options"],
    })
    .refine((data) => data.options.includes(data.answer), {
      message: "Answer must be in options",
      path: ["answer"],
    }),
);

// Task Data
const taskDataSchema = z
  .object({
    url: z.url().trim(),
    image: z.object({
      key: z.string().trim(),
      url: z.url().trim().optional(),
    }),
    description: z.string().trim().min(3).max(100),
  })
  .partial();

// Link Data
const linkDataSchema = z.object({
  url: z.url().trim(),
  date: z.coerce.date(),
});

export const addCourseSectionSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(3).max(100),
    })
    .strict(),
});

export const updateOneCourseSectionSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(3).max(100),
    })
    .strict()
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required",
    ),

  params: z.object({
    sectionId: isObjectId(z.string(), "sectionId"),
  }),
});

export const addCourseModuleSchema = z.object({
  body: z
    .object({
      moduleType: z.enum(["video", "quiz", "task", "link"]),
      title: z.string().trim().min(3).max(100),
      description: z.string().trim().min(3).max(100),

      videoData: videoDataSchema.optional(),
      quizData: quizDataSchema.optional(),
      taskData: taskDataSchema.optional(),
      linkData: linkDataSchema.optional(),
    })
    .strict()
    .refine(
      (data) => data.moduleType !== "video" || data.videoData !== undefined,
      "videoData is required for video modules",
    )
    .refine(
      (data) => data.moduleType !== "quiz" || data.quizData !== undefined,
      "quizData is required for quiz modules",
    )
    .refine(
      (data) => data.moduleType !== "task" || data.taskData !== undefined,
      "taskData is required for task modules",
    )
    .refine(
      (data) => data.moduleType !== "link" || data.linkData !== undefined,
      "linkData is required for link modules",
    ),
});

export const updateOneCourseModuleSchema = z.object({
  body: z
    .object({
      moduleType: z.enum(["video", "quiz", "task", "link"]),
      title: z.string().trim().min(3).max(100).optional(),
      description: z.string().trim().min(3).max(100).optional(),

      videoData: videoDataSchema.optional(),
      quizData: quizDataSchema.optional(),
      taskData: taskDataSchema.optional(),
      linkData: linkDataSchema.optional(),
    })
    .strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required",
    )
    .refine(
      (data) => data.moduleType !== "video" || data.videoData !== undefined,
      "videoData is required for video modules",
    )
    .refine(
      (data) => data.moduleType !== "quiz" || data.quizData !== undefined,
      "quizData is required for quiz modules",
    )
    .refine(
      (data) => data.moduleType !== "task" || data.taskData !== undefined,
      "taskData is required for task modules",
    )
    .refine(
      (data) => data.moduleType !== "link" || data.linkData !== undefined,
      "linkData is required for link modules",
    ),
  params: z
    .object({
      moduleId: isObjectId(z.string(), "moduleId"),
    })
    .strict(),
});
