import cron from "node-cron";
import Subscription from "../models/subscription.model.js";
import { sendEmail } from "../utils/sendEmail.js";

// Daily: every day at 00:05
function scheduleDailySubscriptionReset() {
  cron.schedule("5 0 * * *", async () => {
    try {
      const now = new Date();

      const subscriptions = await Subscription.find({
        endDate: { $lt: now },
        isActive: true,
      })
        .populate("user", "email name")
        .lean();

      if (subscriptions.length > 0) {
        // 1. Get all IDs
        const subIds = subscriptions.map((s) => s._id);

        // 2. Bulk update Subscriptions
        await Subscription.updateMany(
          { _id: { $in: subIds } },
          { $set: { isActive: false } },
        );

        // 3. Send emails sequentially to avoid spamming the SMTP server
        for (const sub of subscriptions) {
          const options = {
            email: sub.user.email,
            subject: `بخصوص اشتراكك في هاش بلس`,
            message: `مرحبا ${sub.user.name},\n\nنود إعلامك بأن اشتراكك في هاش بلس قد انتهى. لمتابعة رحلة التعلم، يرجى تجديد اشتراكك.\n\nشكراً لاستخدامك هاش بلس!\n\nفريق هاش بلس`,
          };

          try {
            await sendEmail(options);
          } catch (err) {
            console.error(
              `Error sending plan expiration email to ${sub.user.email}:`,
              err,
            );
          }
        }
      }

      console.log(
        "Daily subscription expiration cron completed at",
        now.toISOString(),
      );
    } catch (err) {
      console.error("Daily reset failed:", err);
    }
  });
}

export { scheduleDailySubscriptionReset };
