import express from "express";

import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

import {
  createReviewSchema,
  updateReviewSchema,
} from "../validators/review.validator.js";
import {
  mongoIdSchema,
  paginationSchema,
} from "../validators/common.validator.js";
import validate from "../middleware/validate.middleware.js";

import { guard, allowedTo } from "../middleware/auth.middleware.js";
import { checkEnrollment } from "../middleware/enrollment.middleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", validate(paginationSchema), getReviews);
router.get("/:reviewId", validate(mongoIdSchema("reviewId")), getReview);

router.use(guard);

router
  .route("/")
  .post(
    validate(createReviewSchema),
    allowedTo("student"),
    checkEnrollment,
    createReview,
  );
router
  .route("/:reviewId")
  .patch(
    validate(updateReviewSchema),
    allowedTo("student"),
    checkEnrollment,
    updateReview,
  )
  .delete(
    validate(mongoIdSchema("reviewId")),
    allowedTo("student"),
    checkEnrollment,
    deleteReview,
  );

export default router;
