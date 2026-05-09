import { z } from "zod";
import mongoose from "mongoose";
import { createContentSchema } from "./content.validator.js";

const isObjectId = (schema, fieldName = "ID") =>
  schema.refine(
    (value) => mongoose.isValidObjectId(value),
    `${fieldName} must be a valid MongoDB ID`,
  );

const profileImageSchema = z
  .object({
    url: z.url().trim().optional(),
    key: z.string().trim(),
  })
  .strict();

const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(100),
    email: z.email().trim().toLowerCase(),
    password: z.string().trim().min(6).max(100),
    role: z.enum(["student", "instructor", "admin"]),
    phone: z.string().trim().min(11).max(11).optional(),
    bio: z.string().trim().min(3).max(100).optional(),
    languages: z
      .array(
        z.object({
          language: z.string().trim().min(3).max(100).toLowerCase(),
          proficiency: z.string().trim().min(3).max(100).toLowerCase(),
        }),
      )
      .optional(),
    skills: z.array(z.string().trim().min(3).max(100).toLowerCase()).optional(),
    links: z
      .array(
        z.object({
          name: z.string().trim().min(3).max(100).toLowerCase(),
          url: z.url().trim(),
        }),
      )
      .optional(),

    profileImage: profileImageSchema.optional(),
    experience: z
      .array(
        z.object({
          company: z.string().trim().min(3).max(100).toLowerCase(),
          country: z.string().trim().min(3).max(100).toLowerCase(),
          city: z.string().trim().min(3).max(100).toLowerCase(),
          jobTitle: z.string().trim().min(3).max(100).toLowerCase(),
          jobType: z.string().trim().min(3).max(100).toLowerCase(),
          jobStyle: z.string().trim().min(3).max(100).toLowerCase(),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
          skills: z
            .array(z.string().trim().min(3).max(100).toLowerCase())
            .optional(),
          description: z.string().trim().min(3).max(100).toLowerCase(),
          isCurrent: z.boolean(),
        }),
      )
      .optional(),

    education: z
      .array(
        z.object({
          institution: z.string().trim().min(3).max(100).toLowerCase(),
          degree: z.string().trim().min(3).max(100).toLowerCase(),
          major: z.string().trim().min(3).max(100).toLowerCase(),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
          description: z.string().trim().min(3).max(100).toLowerCase(),
          isCurrent: z.boolean(),
        }),
      )
      .optional(),

    instructorDetails: z
      .object({
        teachingStyle: z.string().trim().min(3).max(100).toLowerCase(),
        videoProfessionality: z.string().trim().min(3).max(100).toLowerCase(),
        targetAudience: z.string().trim().min(3).max(100).toLowerCase(),
        isVerified: z.boolean(),
        verifiedAt: z.coerce.date(),
      })
      .partial(),

    studentDetails: z
      .object({
        projects: z
          .array(
            z.object({
              title: z.string().trim().min(3).max(100).toLowerCase(),
              description: z.string().trim().min(3).max(100).toLowerCase(),
              roleInProject: z.string().trim().min(3).max(100).toLowerCase(),
              skillsUsed: z
                .array(z.string().trim().min(3).max(100).toLowerCase())
                .optional(),
              startDate: z.coerce.date(),
              endDate: z.coerce.date(),
              projectImageUrls: z.array(z.url().trim()).optional(),
            }),
          )
          .optional(),
        certificates: z
          .array(
            z.object({
              name: z.string().trim().min(3).max(100).toLowerCase(),
              description: z.string().trim().min(3).max(100).toLowerCase(),
              contentId: isObjectId(z.string(), "contentId"),
              certificateUrl: z.url().trim(),
              issuedAt: z.coerce.date(),
            }),
          )
          .optional(),
      })
      .partial(),
  }),
});

export { createUserSchema, createContentSchema };
