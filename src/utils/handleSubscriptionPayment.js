import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import Enrollment from "../models/enrollment.model.js";
import { Bootcamp } from "../models/content.model.js";

export const handlePlatformSubscriptionPayment = async (user, payment) => {
  try {
    const { plan_months, plan_amount } = payment?.metadata || {};

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

    const paymentRecord = await Payment.create({
      user: user._id,
      paymentId: payment.id,
      provider: payment.provider,
      status: payment.status,
      date: payment.created_at,
      method: payment.payment_method,
      amount: payment.amount,
      currency: payment.currency,
    });

    if (paymentRecord) {
      await Subscription.create({
        type: "platform",
        user: user._id,
        payment: paymentRecord._id,
        name: payment?.metadata?.subscriptionName,
        description: payment?.metadata?.subscriptionDescription,
        duration: payment?.metadata?.subscriptionType,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
      });
    } else {
      throw new Error("Payment record not created");
    }

    return { startDate, endDate };
  } catch (err) {
    console.error("Error handling general subscription payment:", err);
    throw err;
  }
};

export const handleBootcampSubscriptionPayment = async (user, payment) => {
  try {
    const { bootcampId, plan_months, plan_amount } = payment?.metadata || {};

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

    const paymentRecord = await Payment.create({
      user: user._id,
      paymentId: payment.id,
      provider: payment.provider,
      status: payment.status,
      date: payment.created_at,
      method: payment.payment_method,
      amount: payment.amount,
      currency: payment.currency,
    });

    if (paymentRecord) {
      const newSubscription = await Subscription.create({
        type: "bootcamp",
        user: user._id,
        payment: paymentRecord._id,
        bootcamp: bootcamp._id,
        name: payment?.metadata?.subscriptionName,
        description: payment?.metadata?.subscriptionDescription,
        duration: payment?.metadata?.subscriptionType,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
      });

      if (newSubscription) {
        await Enrollment.create({
          user: user._id,
          content: bootcamp._id,
          type: "bootcamp",
        });
      }
    } else {
      throw new Error("Payment record not created");
    }

    return { bootcamp };
  } catch (err) {
    console.error("Error handling bootcamp subscription payment:", err);
    throw err;
  }
};
