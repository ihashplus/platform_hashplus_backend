import express from "express";
const router = express.Router({ mergeParams: true });

import { guard, allowedTo } from "../middleware/auth.middleware.js";
import {
  validateCoupon,
  createCoupon,
  deleteCoupon,
  getCoupon,
  getCoupons,
  updateCoupon,
} from "../controllers/coupon.controller.js";

router.use(guard);

router.route("/validate").post(validateCoupon);

router.use(allowedTo("admin", "instructor"));

router.route("/").post(createCoupon).get(getCoupons);

router.route("/:id").get(getCoupon).patch(updateCoupon).delete(deleteCoupon);

export default router;
