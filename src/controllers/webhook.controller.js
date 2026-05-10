import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";
import { MOYASAR_WEBHOOK_SECRET, EMAIL_USER } from "../config/env.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import {
  handlePlatformSubscriptionPayment,
  handleBootcampSubscriptionPayment,
} from "../utils/handleSubscriptionPayment.js";
import Subscription from "../models/subscription.model.js";

// handle moyasar webhook
const moyasarWebhook = async (req, res) => {
  try {
    console.log("Moyasar webhook received");

    // 1. Verify Secret Token securely
    const payload = req.body.toString("utf-8");
    const event = JSON.parse(payload);

    // Timing-safe comparison to prevent timing attacks
    const receivedToken = Buffer.from(event.secret_token || "");
    const expectedToken = Buffer.from(MOYASAR_WEBHOOK_SECRET || "");

    const isSecretValid =
      receivedToken.length === expectedToken.length &&
      crypto.timingSafeEqual(receivedToken, expectedToken);

    if (!isSecretValid) {
      console.error("Invalid webhook secret");
      return res.status(401).json({ message: "Invalid webhook secret" });
    }

    // idempotency check
    let paymentRecord = await Payment.findOne({
      paymentId: event.data.id,
    });

    if (event.type === "payment_paid" && paymentRecord) {
      console.error(
        `Payment record already exists for payment id ${paymentRecord.id} which is paid`,
      );
      return;
    } else if (event.type === "payment_refunded" && !paymentRecord) {
      console.error(
        `Payment record not found for payment id ${paymentRecord.id} which is refunded`,
      );
      return;
    }

    // Immediately return 200 OK to prevent timeouts and retries from Moyasar
    res.status(200).json({ message: "Webhook received" });

    // Process the heavy logic asynchronously in the background
    (async () => {
      try {
        const payment = event.data;

        const { customer_id, type, subscriptionName, plan_months } =
          payment?.metadata || {};

        // 2. Look up User
        if (!customer_id) {
          console.error(`customer_id is missing for payment ${payment.id}`);
          return;
        }

        const user = await User.findById(customer_id);
        if (!user) {
          console.error(
            `User ${customer_id} not found for payment ${payment.id}`,
          );
          return;
        }

        // 3. Handle Specific Event Types
        if (event.type === "payment_failed") {
          await sendEmail({
            email: user.email,
            subject: "فشل الدفع في هاش بلس",
            message: `مرحبا ${user.name},\n\nنود إعلامك بأن محاولتك للاشتراك لم تكتمل بنجاح...`,
          });
          return;
        }

        if (event.type === "payment_refunded") {
          const subscription = await Subscription.findOne({
            payment: paymentRecord._id,
          });

          if (!subscription) {
            console.error(`Subscription not found for payment ${payment.id}`);
            return;
          }

          if (!subscription.isActive) {
            console.error(
              `Subscription is already cancelled for payment ${payment.id}`,
            );
            return;
          }

          await Payment.findOneAndUpdate(
            { _id: paymentRecord._id },
            { status: "refunded", isRefunded: true, refundedAt: new Date() },
          );

          await Subscription.findOneAndUpdate(
            { _id: subscription._id },
            { isActive: false, isCancelled: true, cancelledAt: new Date() },
          );

          console.log("sending email after payment refund from webhook...");

          await sendEmail({
            email: user.email,
            subject: "تم استرداد الدفعة في هاش بلس",
            message: `مرحبا ${user.name},\n\nتم استرداد دفعتك في منصة هاش بلس بنجاح.`,
          });
          return;
        }

        if (event.type === "payment_paid") {
          let options = {};
          let adminOptions = {};

          // 6. Create subscription record
          if (type === "platform") {
            const { startDate, endDate } =
              await handlePlatformSubscriptionPayment(user, payment);

            // Email options to notify user about new payment
            options = {
              email: user.email,
              subject: "تم الاشتراك بنجاح",
              message: `مرحبا ${user.name},\n\nتم تفعيل اشتراكك في منصة هاش بلس بنجاح حتى ${endDate.toDateString()}.`,
            };

            // Email options to notify admin about new payment
            adminOptions = {
              email: EMAIL_USER,
              subject: "مشترك جديد في منصة هاش بلس!",
              message: `
      قام ${user.name} بالاشتراك في باقة ${subscriptionName} المميزة.

      تفاصيل الاشتراك:
      - الاسم: ${user.name}
      - البريد الإلكتروني: ${user.email}
      - تاريخ الاشتراك: ${startDate.toDateString()}
      - تاريخ الانتهاء: ${endDate.toDateString()}
      - المبلغ: ${payment.amount / 100} ريال
      - مدة الاشتراك: ${Number(plan_months)} شهر
      - معرّف الدفعة: ${payment.id}
      - رابط الدفعة: ${payment.receipt_url}
      `,
            };
          } else if (type === "bootcamp") {
            const { bootcamp } = await handleBootcampSubscriptionPayment(
              user,
              payment,
            );

            // Email options to notify user about new payment
            options = {
              email: user.email,
              subject: "تم الاشتراك بنجاح",
              message: `مرحبا ${user.name},\n\nتم تفعيل اشتراكك في بوتكامب "${bootcamp.title || subscriptionName}" بنجاح.`,
            };

            // Email options to notify admin about new payment
            adminOptions = {
              email: EMAIL_USER,
              subject: "مشترك جديد في منصة هاش بلس!",
              message: `
      قام ${user.name} بالاشتراك في بوتكامب ${bootcamp.title || subscriptionName}.

      تفاصيل الاشتراك:
      - الاسم: ${user.name}
      - البريد الإلكتروني: ${user.email}
      - المبلغ: ${payment.amount / 100} ريال
      - معرّف الدفعة: ${payment.id}
      - رابط الدفعة: ${payment.receipt_url}
      `,
            };
          } else {
            console.error("Invalid subscription type");
            return;
          }

          // 7. send email to user and admin
          try {
            console.log("sending email after payment success from webhook...");
            // send email to user
            await sendEmail(options);
            // send email to admin
            await sendEmail(adminOptions);
          } catch (err) {
            console.error("Email send error:", err);
          }
        }
      } catch (backgroundErr) {
        console.error("Moyasar background processing error:", backgroundErr);
      }
    })();
  } catch (err) {
    console.error("Moyasar webhook initial error:", err);
    if (!res.headersSent) {
      return res.status(400).json({ message: "Webhook error" });
    }
  }
};

export { moyasarWebhook };
