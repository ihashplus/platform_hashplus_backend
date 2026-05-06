import authRoutes from "./auth.route.js";
import profileRoutes from "./profile.route.js";
import categoryRoutes from "./category.route.js";
import contentRoutes from "./content.route.js";
import reviewRoutes from "./review.route.js";
import uploadRoutes from "./upload.route.js";
import subscriptionRoutes from "./subscription.route.js";
import dashboardRoutes from "./dashboard.route.js";
import couponRoutes from "./coupon.route.js";
import enrollmentsRoutes from "./enrollment.route.js";
import cartRoutes from "./cart.route.js";

export default (app) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/profiles", profileRoutes);
  app.use("/api/v1/categories", categoryRoutes);
  app.use("/api/v1/contents", contentRoutes);
  app.use("/api/v1/reviews", reviewRoutes);
  app.use("/api/v1/uploads", uploadRoutes);
  app.use("/api/v1/subscriptions", subscriptionRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);
  app.use("/api/v1/coupons", couponRoutes);
  app.use("/api/v1/enrollments", enrollmentsRoutes);
  app.use("/api/v1/cart", cartRoutes);
};
