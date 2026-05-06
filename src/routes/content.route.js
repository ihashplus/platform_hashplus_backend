import express from "express";
const router = express.Router({ mergeParams: true });

import {
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
} from "../controllers/content.controller.js";

import {
  createContentSchema,
  updateContentSchema,
} from "../validators/content.validator.js";

import {
  mongoIdSchema,
  paginationSchema,
} from "../validators/common.validator.js";

import reviewRoute from "./review.route.js";
import courseRoute from "./course.route.js";
import bootcampRoute from "./bootcamp.route.js";
import submissionRoutes from "./submission.route.js";
import enrollmentsRoutes from "./enrollment.route.js";

import validate from "../middleware/validate.middleware.js";
import { guard, allowedTo } from "../middleware/auth.middleware.js";

// ---------------------- Nested Routes ----------------------
router.use("/:contentId/reviews", reviewRoute);
router.use("/:contentId/courses", courseRoute);
router.use("/:contentId/bootcamps", bootcampRoute);
router.use("/:contentId/submissions", submissionRoutes);

// ---------------------- Main Routes ----------------------

router.get("/", validate(paginationSchema), getContents);
router.get("/:contentId", validate(mongoIdSchema("contentId")), getContent);

router.use(guard, allowedTo("admin", "instructor"));

router.post("/", validate(createContentSchema), createContent);
router.patch("/:contentId", validate(updateContentSchema), updateContent);
router.delete(
  "/:contentId",
  validate(mongoIdSchema("contentId")),
  deleteContent,
);

export default router;
