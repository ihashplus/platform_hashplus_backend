import express from "express";
const router = express.Router({ mergeParams: true });

import {
  // Sections
  getAllCourseSections,
  getOneCourseSection,
  addCourseSection,
  updateOneCourseSection,
  removeOneCourseSection,

  // Modules
  getAllCourseModules,
  getOneCourseModule,
  addCourseModule,
  updateOneCourseModule,
  removeOneCourseModule,
} from "../controllers/course.controller.js";

import {
  // Sections
  sectionAndModuleParamsSchema,
  addCourseSectionSchema,
  updateOneCourseSectionSchema,

  // Modules
  addCourseModuleSchema,
  updateOneCourseModuleSchema,
} from "../validators/course.validator.js";
import { mongoIdSchema } from "../validators/common.validator.js";
import { checkSubscription } from "../middleware/subscription.middleware.js";
import { checkEnrollment } from "../middleware/enrollment.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { guard, allowedTo } from "../middleware/auth.middleware.js";

router.use(guard);

// ---------------------- Sections ----------------------
router.get("/sections", getAllCourseSections);
router.get(
  "/sections/:sectionId",
  validate(mongoIdSchema("sectionId")),
  // checkSubscription("platform"),
  // checkEnrollment,
  getOneCourseSection,
);

router.post(
  "/sections",
  validate(addCourseSectionSchema),
  allowedTo("admin", "instructor"),
  addCourseSection,
);

router.patch(
  "/sections/:sectionId",
  validate(updateOneCourseSectionSchema),
  allowedTo("admin", "instructor"),
  updateOneCourseSection,
);

router.delete(
  "/sections/:sectionId",
  validate(mongoIdSchema("sectionId")),
  allowedTo("admin", "instructor"),
  removeOneCourseSection,
);

// ---------------------- Modules Routes ----------------------
router.get(
  "/sections/:sectionId/modules",
  validate(mongoIdSchema("sectionId")),
  getAllCourseModules,
);

router.get(
  "/sections/:sectionId/modules/:moduleId",
  validate(sectionAndModuleParamsSchema),
  // checkSubscription("platform"),
  // checkEnrollment,
  getOneCourseModule,
);

router.post(
  "/sections/:sectionId/modules",
  validate(addCourseModuleSchema),
  allowedTo("admin", "instructor"),
  addCourseModule,
);
router.patch(
  "/sections/:sectionId/modules/:moduleId",
  validate(updateOneCourseModuleSchema),
  allowedTo("admin", "instructor"),
  updateOneCourseModule,
);
router.delete(
  "/sections/:sectionId/modules/:moduleId",
  validate(sectionAndModuleParamsSchema),
  allowedTo("admin", "instructor"),
  removeOneCourseModule,
);

export default router;
