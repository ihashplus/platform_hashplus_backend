import axios from "axios";
import Payment from "../models/payment.model.js";
import { MOYASAR_SECRET_KEY } from "../config/env.js";

const refundPayment = async (paymentId, amount = null) => {
  try {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new Error("Payment not found");
    }
    if (payment.isRefunded) {
      throw new Error("Payment already refunded");
    }

    const payload = amount ? { amount } : {};

    const response = await axios.post(
      `https://api.moyasar.com/v1/payments/${paymentId}/refund`,
      payload,
      {
        auth: {
          username: MOYASAR_SECRET_KEY,
          password: "",
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status === "refunded") {
      await Payment.findOneAndUpdate(
        { paymentId },
        {
          $set: {
            status: "refunded",
            isRefunded: true,
            refundedAt: new Date(),
          },
        },
      );

      return response.data;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      "Error refunding payment:",
      error.response?.data || error.message,
    );
    return null;
  }
};

export { refundPayment };
