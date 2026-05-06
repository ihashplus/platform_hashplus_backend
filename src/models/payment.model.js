import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    paymentId: { type: String, required: true, unique: true },
    provider: { type: String, required: true },
    status: { type: String, required: true },
    date: { type: Date, required: true },
    method: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },

    isRefunded: { type: Boolean, default: false },
    refundedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
