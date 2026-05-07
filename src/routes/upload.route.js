import express from "express";
const router = express.Router();

import {
  startUpload,
  completeUpload,
  abortUpload,
  removeUpload,
  getStreamUrl,
} from "../controllers/upload.controller.js";

import {
  startUploadSchema,
  completeUploadSchema,
  removeUploadSchema,
  streamUrlSchema,
} from "../validators/upload.validator.js";

import validate from "../middleware/validate.middleware.js";
// import { checkSubscription } from "../middleware/subscription.middleware.js";
// import { checkEnrollment } from "../middleware/enrollment.middleware.js";

import { guard, allowedTo } from "../middleware/auth.middleware.js";

router.use(guard);

// ── Streaming URL (any authenticated, active-platform subscriber) ──────────
router.post(
  "/stream-platform",
  validate(streamUrlSchema),
  // checkSubscription("platform"),
  // checkEnrollment,
  getStreamUrl,
);

router.post(
  "/stream-bootcamp/:contentId",
  validate(streamUrlSchema),
  // checkSubscription("bootcamp"),
  // checkEnrollment,
  getStreamUrl,
);

// ── Multipart upload management (admin / instructor only) ──────────────────
router.use(allowedTo("admin", "instructor"));

router.post("/multipart/start", validate(startUploadSchema), startUpload);
router.post(
  "/multipart/complete",
  validate(completeUploadSchema),
  completeUpload,
);
router.delete("/multipart/abort", validate(removeUploadSchema), abortUpload);
router.delete("/multipart/delete", validate(removeUploadSchema), removeUpload);

export default router;
