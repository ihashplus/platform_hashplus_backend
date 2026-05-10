import mongoose from "mongoose";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import Enrollment from "../models/enrollment.model.js";
import { Bootcamp } from "../models/content.model.js";
import Coupon from "../models/coupon.model.js";
import Cart from "../models/cart.model.js";

const updateCouponUsage = async (
  couponId,
  userId,
  appliedDiscountAmount,
  session,
) => {
  if (!couponId) return;
  try {
    const coupon = await Coupon.findById(couponId).session(session);
    if (!coupon) return;

    coupon.discountAmount =
      (coupon.discountAmount || 0) + Number(appliedDiscountAmount || 0);

    const userUsageIndex = coupon.usageCounter.findIndex(
      (u) => u.user.toString() === userId.toString(),
    );
    if (userUsageIndex > -1) {
      coupon.usageCounter[userUsageIndex].count += 1;
      coupon.markModified("usageCounter");
    } else {
      coupon.usageCounter.push({ user: userId, count: 1 });
    }

    await coupon.save({ session });
  } catch (error) {
    console.error("Error updating coupon usage:", error);
  }
};

export const handlePlatformSubscriptionPayment = async (user, payment) => {
  try {
    const {
      plan_months,
      plan_amount,
      couponId,
      discountAmount,
      originalAmount,
    } = payment?.metadata || {};

    // Note: Moyasar amounts are in Halalas (100 = 1 SAR). Ensure plan_amount matches this unit.
    if (plan_amount && Number(payment.amount) !== Number(plan_amount)) {
      console.error("Amount mismatch detected!");
      throw new Error("Payment amount mismatch");
    }

    if (!plan_months || isNaN(Number(plan_months))) {
      throw new Error("Invalid plan_months in metadata");
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(plan_months));

    const subscription = await Subscription.findOne({
      user: user._id,
      type: "platform",
      isActive: true,
    });

    if (subscription) {
      throw new Error("User already subscribed to this platform subscription");
    }

    // Start a transaction to ensure atomicity
    const session = await mongoose.startSession();
    let paymentRecord;

    try {
      await session.withTransaction(async () => {
        paymentRecord = await Payment.create(
          {
            user: user._id,
            paymentId: payment.id,
            provider: payment.provider,
            status: payment.status,
            date: payment.created_at,
            method: payment.payment_method,
            amount: payment.amount,
            currency: payment.currency,
            coupon: couponId || undefined,
            originalAmount: originalAmount
              ? Number(originalAmount)
              : payment.amount,
            discountAmount: discountAmount ? Number(discountAmount) : 0,
            finalAmount: payment.amount,
          },
          { session },
        );

        if (paymentRecord) {
          const newSubscription = await Subscription.create(
            {
              type: "platform",
              user: user._id,
              payment: paymentRecord._id,
              coupon: couponId || undefined,
              name: payment?.metadata?.subscriptionName,
              description: payment?.metadata?.subscriptionDescription,
              duration: payment?.metadata?.subscriptionType,
              startDate: startDate,
              endDate: endDate,
              isActive: true,
            },
            { session },
          );

          if (newSubscription && couponId) {
            await updateCouponUsage(
              couponId,
              user._id,
              discountAmount,
              session,
            );
          }
        } else {
          throw new Error("Payment record not created");
        }
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error starting transaction:", error);
      throw error;
    } finally {
      await session.endSession();
    }

    return { startDate, endDate };
  } catch (err) {
    console.error("Error handling general subscription payment:", err);
    throw err;
  }
};

export const handleBootcampSubscriptionPayment = async (user, payment) => {
  try {
    const {
      bootcampId,
      plan_months,
      plan_amount,
      couponId,
      discountAmount,
      originalAmount,
    } = payment?.metadata || {};

    if (!bootcampId) {
      throw new Error("Invalid bootcampId in metadata");
    }

    const bootcamp = await Bootcamp.findById(bootcampId);
    if (!bootcamp) {
      throw new Error("Bootcamp not found");
    }

    // Note: Moyasar amounts are in Halalas (100 = 1 SAR). Ensure plan_amount matches this unit.
    if (plan_amount && Number(payment.amount) !== Number(plan_amount)) {
      console.error("Amount mismatch detected!");
      throw new Error("Payment amount mismatch");
    }

    if (!plan_months || isNaN(Number(plan_months))) {
      throw new Error("Invalid plan_months in metadata");
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(plan_months));

    const subscription = await Subscription.findOne({
      user: user._id,
      type: "bootcamp",
      bootcamp: bootcampId,
      isActive: true,
    });

    if (subscription) {
      throw new Error("User already subscribed to this bootcamp");
    }

    // Start a transaction to ensure atomicity
    const session = await mongoose.startSession();
    let paymentRecord;

    try {
      await session.withTransaction(async () => {
        paymentRecord = await Payment.create(
          {
            user: user._id,
            paymentId: payment.id,
            provider: payment.provider,
            status: payment.status,
            date: payment.created_at,
            method: payment.payment_method,
            amount: payment.amount,
            currency: payment.currency,
            coupon: couponId || undefined,
            originalAmount: originalAmount
              ? Number(originalAmount)
              : payment.amount,
            discountAmount: discountAmount ? Number(discountAmount) : 0,
            finalAmount: payment.amount,
          },
          { session },
        );

        if (paymentRecord) {
          const newSubscription = await Subscription.create(
            {
              type: "bootcamp",
              user: user._id,
              payment: paymentRecord._id,
              coupon: couponId || undefined,
              bootcamp: bootcamp._id,
              name: payment?.metadata?.subscriptionName,
              description: payment?.metadata?.subscriptionDescription,
              duration: payment?.metadata?.subscriptionType,
              startDate: startDate,
              endDate: endDate,
              isActive: true,
            },
            { session },
          );

          if (newSubscription) {
            await Enrollment.create(
              {
                user: user._id,
                content: bootcamp._id,
                type: "bootcamp",
              },
              { session },
            );

            // Remove from Cart
            await Cart.findOneAndUpdate(
              { user: user._id },
              { $pull: { bootcamps: bootcamp._id } },
              { session },
            );
          }

          if (couponId) {
            await updateCouponUsage(
              couponId,
              user._id,
              discountAmount,
              session,
            );
          }
        } else {
          throw new Error("Payment record not created");
        }
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error starting transaction:", error);
      throw error;
    } finally {
      await session.endSession();
    }

    return { bootcamp };
  } catch (err) {
    console.error("Error handling bootcamp subscription payment:", err);
    throw err;
  }
};
