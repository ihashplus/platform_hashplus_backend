import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    duration: {
      type: String,
      enum: ["1_month", "3_months", "1_year"],
    },
    startDate: { type: Date },
    endDate: { type: Date },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    type: {
      type: String,
      enum: ["platform", "bootcamp"],
      required: true,
    },

    bootcamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
    },

    isActive: { type: Boolean, default: true },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

// Most common auth-guard lookup
subscriptionSchema.index({ user: 1, type: 1, isActive: 1 });
// Cron job: find all expired active general subscriptions
subscriptionSchema.index({
  endDate: 1,
  isActive: 1,
  type: 1,
});
// Webhook idempotency lookup
subscriptionSchema.index({ payment: 1 }, { sparse: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
