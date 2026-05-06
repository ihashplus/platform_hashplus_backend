import express from "express";
const router = express.Router({ mergeParams: true });

import {
  submitQuiz,
  submitTask,
  submitFinalProject,
  getMySubmissions,
  getAllSubmissions,
  feedbackOnFinalProject,
} from "../controllers/submission.controller.js";

import {
  getAllSubmissionsSchema,
  submitQuizSchema,
  submitTaskSchema,
  submitFinalProjectSchema,
  feedbackOnFinalProjectSchema,
} from "../validators/submission.validator.js";
import { mongoIdSchema } from "../validators/common.validator.js";
import validate from "../middleware/validate.middleware.js";
import { checkEnrollment } from "../middleware/enrollment.middleware.js";
import { checkSubscription } from "../middleware/subscription.middleware.js";

import { guard, allowedTo } from "../middleware/auth.middleware.js";
router.use(guard);

// ---------------------- All ----------------------
router.get(
  "/",
  allowedTo("student"),
  validate(mongoIdSchema("contentId")),
  checkSubscription("platform"),
  checkEnrollment,
  getMySubmissions,
);

// ---------------------- Course Submissions Routes ----------------------
router.post(
  "/courses/sections/:sectionId/modules/:moduleId/quiz",
  allowedTo("student"),
  validate(submitQuizSchema),
  checkSubscription("platform"),
  checkEnrollment,
  submitQuiz,
);

router.post(
  "/courses/sections/:sectionId/modules/:moduleId/task",
  allowedTo("student"),
  validate(submitTaskSchema),
  checkSubscription("platform"),
  checkEnrollment,
  submitTask,
);

router.post(
  "/courses/final-project",
  allowedTo("student"),
  validate(submitFinalProjectSchema),
  checkSubscription("platform"),
  checkEnrollment,
  submitFinalProject,
);

// ---------------------- Bootcamp Submissions Routes ----------------------

router.post(
  "/bootcamps/sections/:sectionId/modules/:moduleId/quiz",
  allowedTo("student"),
  validate(submitQuizSchema),
  checkSubscription("bootcamp"),
  checkEnrollment,
  submitQuiz,
);

router.post(
  "/bootcamps/sections/:sectionId/modules/:moduleId/task",
  allowedTo("student"),
  validate(submitTaskSchema),
  checkSubscription("bootcamp"),
  checkEnrollment,
  submitTask,
);

router.post(
  "/bootcamps/final-project",
  allowedTo("student"),
  validate(submitFinalProjectSchema),
  checkSubscription("bootcamp"),
  checkEnrollment,
  submitFinalProject,
);

// ---------------------- Admin and Instructor Routes ----------------------
router.get(
  "/all",
  allowedTo("admin", "instructor"),
  validate(getAllSubmissionsSchema),
  getAllSubmissions,
);

router.patch(
  "/final-project/feedback",
  allowedTo("admin", "instructor"),
  validate(feedbackOnFinalProjectSchema),
  feedbackOnFinalProject,
);

export default router;
