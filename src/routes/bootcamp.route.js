import express from "express";
const router = express.Router({ mergeParams: true });

import {
  // Sections
  getOneBootcampSection,
  getAllBootcampSections,
  addBootcampSection,
  updateOneBootcampSection,
  removeOneBootcampSection,

  // Modules
  getOneBootcampModule,
  getAllBootcampModules,
  addBootcampModule,
  updateOneBootcampModule,
  removeOneBootcampModule,
} from "../controllers/bootcamp.controller.js";

import {
  sectionAndModuleParamsSchema,
  addBootcampModuleSchema,
  updateOneBootcampModuleSchema,
  addBootcampSectionSchema,
  updateOneBootcampSectionSchema,
} from "../validators/bootcamp.validator.js";
import { mongoIdSchema } from "../validators/common.validator.js";

import validate from "../middleware/validate.middleware.js";
import { checkSubscription } from "../middleware/subscription.middleware.js";
import { checkEnrollment } from "../middleware/enrollment.middleware.js";
import { guard, allowedTo } from "../middleware/auth.middleware.js";

router.use(guard);

// ---------------------- Sections ----------------------

router.get("/sections", getAllBootcampSections);
router.get(
  "/sections/:sectionId",
  validate(mongoIdSchema("sectionId")),
  checkSubscription("bootcamp"),
  checkEnrollment,
  getOneBootcampSection,
);

router.post(
  "/sections",
  validate(addBootcampSectionSchema),
  allowedTo("admin", "instructor"),
  addBootcampSection,
);

router.patch(
  "/sections/:sectionId",
  validate(updateOneBootcampSectionSchema),
  allowedTo("admin", "instructor"),
  updateOneBootcampSection,
);

router.delete(
  "/sections/:sectionId",
  validate(mongoIdSchema("sectionId")),
  allowedTo("admin", "instructor"),
  removeOneBootcampSection,
);

// ---------------------- Modules ----------------------

router.get(
  "/sections/:sectionId/modules",
  validate(mongoIdSchema("sectionId")),
  getAllBootcampModules,
);

router.get(
  "/sections/:sectionId/modules/:moduleId",
  validate(sectionAndModuleParamsSchema),
  checkSubscription("bootcamp"),
  checkEnrollment,
  getOneBootcampModule,
);

router.post(
  "/sections/:sectionId/modules",
  validate(addBootcampModuleSchema),
  allowedTo("admin", "instructor"),
  addBootcampModule,
);

router.patch(
  "/sections/:sectionId/modules/:moduleId",
  validate(updateOneBootcampModuleSchema),
  allowedTo("admin", "instructor"),
  updateOneBootcampModule,
);

router.delete(
  "/sections/:sectionId/modules/:moduleId",
  validate(sectionAndModuleParamsSchema),
  allowedTo("admin", "instructor"),
  removeOneBootcampModule,
);

export default router;
