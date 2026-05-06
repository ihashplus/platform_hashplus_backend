import express from "express";
const router = express.Router({ mergeParams: true });

import {
  getMyEnrollements,
  addToEnrollements,
  removeFromEnrollements,
} from "../controllers/enrollment.controller.js";

import { mongoIdSchema } from "../validators/common.validator.js";

import { checkSubscription } from "../middleware/subscription.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { guard, allowedTo } from "../middleware/auth.middleware.js";

router.use(guard, allowedTo("student"));

// ---------------------- All Routes ----------------------
router.get("/", getMyEnrollements);

// ---------------------- Courses Routes ----------------------
router.post(
  "/courses/:contentId",
  validate(mongoIdSchema("contentId")),
  // checkSubscription("platform"),
  addToEnrollements,
);
router.delete(
  "/courses/:contentId",
  validate(mongoIdSchema("contentId")),
  // checkSubscription("platform"),
  removeFromEnrollements,
);

// ---------------------- Bootcamp Routes ----------------------
router.post(
  "/bootcamps/:contentId",
  validate(mongoIdSchema("contentId")),
  // checkSubscription("bootcamp"),
  addToEnrollements,
);
router.delete(
  "/bootcamps/:contentId",
  validate(mongoIdSchema("contentId")),
  // checkSubscription("bootcamp"),
  removeFromEnrollements,
);

export default router;
