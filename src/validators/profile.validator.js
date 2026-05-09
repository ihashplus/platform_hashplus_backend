import { z } from "zod";
import mongoose from "mongoose";

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

export const updateMyProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(3).max(100),
      bio: z.string().trim().min(3).max(100),
      languages: z.array(
        z.object({
          language: z.string().trim().min(3).max(100),
          proficiency: z.string().trim().min(3).max(100),
        }),
      ),
      skills: z.array(z.string().trim()),
      links: z.array(
        z.object({
          name: z.string().trim().min(3).max(100),
          url: z.url().trim(),
        }),
      ),
      profileImage: profileImageSchema,
      experience: z.array(
        z.object({
          company: z.string().trim().min(3).max(100),
          country: z.string().trim().min(3).max(100),
          city: z.string().trim().min(3).max(100),
          jobTitle: z.string().trim().min(3).max(100),
          jobType: z.string().trim().min(3).max(100),
          jobStyle: z.string().trim().min(3).max(100),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
          skills: z.array(z.string().trim()),
          description: z.string().trim().min(3).max(100),
          isCurrent: z.boolean(),
        }),
      ),
      education: z.array(
        z.object({
          institution: z.string().trim().min(3).max(100),
          degree: z.string().trim().min(3).max(100),
          major: z.string().trim().min(3).max(100),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
          description: z.string().trim().min(3).max(100),
          isCurrent: z.boolean(),
        }),
      ),
      instructorDetails: z.object({
        teachingStyle: z.string().trim().min(3).max(100),
        videoProfessionality: z.string().trim().min(3).max(100),
        targetAudience: z.string().trim().min(3).max(100),
      }),
      studentDetails: z.object({
        projects: z.array(
          z.object({
            title: z.string().trim().min(3).max(100),
            description: z.string().trim().min(3).max(100),
            roleInProject: z.string().trim().min(3).max(100),
            skillsUsed: z.array(z.string().trim()),
            startDate: z.coerce.date(),
            endDate: z.coerce.date(),
            projectImageUrls: z.array(z.url().trim()),
          }),
        ),
        certificates: z.array(
          z.object({
            name: z.string().trim().min(3).max(100),
            description: z.string().trim().min(3).max(100),
            contentId: isObjectId(z.string(), "contentId"),
            certificateUrl: z.url().trim(),
            issuedAt: z.coerce.date(),
          }),
        ),
      }),
    })
    .strict()
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field is required",
    ),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().trim().min(6).max(100),
      newPassword: z.string().trim().min(6).max(100),
      confirmNewPassword: z.string().trim().min(6).max(100),
    })
    .strict()
    .refine(
      (data) => data.newPassword === data.confirmNewPassword,
      "Passwords do not match",
    )
    .refine(
      (data) => data.newPassword !== data.currentPassword,
      "New password cannot be the same as the current password",
    ),
});
