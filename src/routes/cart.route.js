import express from "express";
import { guard } from "../middleware/auth.middleware.js";
import {
  addBootcampToCart,
  getCart,
  removeBootcampFromCart,
} from "../controllers/cart.controller.js";
import validate from "../middleware/validate.middleware.js";
import { mongoIdSchema } from "../validators/common.validator.js";

const router = express.Router();

router.use(guard); // Ensure user is logged in for all cart routes

// ---------------------- Cart Routes ----------------------
router.route("/").get(getCart);
router
  .route("/bootcamps/:bootcampId")
  .post(validate(mongoIdSchema("bootcampId")), addBootcampToCart)
  .delete(validate(mongoIdSchema("bootcampId")), removeBootcampFromCart);

export default router;
