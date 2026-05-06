import express from "express";
const router = express.Router();

import {
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
  changePassword,
  getMyProfileImage,
  deleteMyProfileImage,

  // uploadMyProfileImage,
} from "../controllers/profile.controller.js";

import { guard } from "../middleware/auth.middleware.js";

import {
  updateMyProfileSchema,
  changePasswordSchema,
} from "../validators/profile.validator.js";
import validate from "../middleware/validate.middleware.js";

router.use(guard);

// Logged in User Profile routes
router.get("/", getMyProfile);
router.delete("/", deleteMyProfile);
router.patch("/", validate(updateMyProfileSchema), updateMyProfile);
router.patch(
  "/change-password",
  validate(changePasswordSchema),
  changePassword,
);

router.get("/profileImage", getMyProfileImage);
router.delete("/profileImage", deleteMyProfileImage);
// router.patch("/profileImage", uploadMyProfileImage);

export default router;
