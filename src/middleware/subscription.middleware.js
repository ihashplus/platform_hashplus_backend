import mongoose from "mongoose";
import Subscription from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";

export const checkSubscription = (type) => async (req, res, next) => {
  try {
    let query = {
      user: req.user._id,
      isActive: true,
    };

    if (type === "platform") {
      query.type = "platform";
    } else if (type === "bootcamp") {
      const bootcamp = req?.params?.contentId || null;

      if (!bootcamp || !mongoose.isValidObjectId(bootcamp)) {
        return next(new ApiError("يرجى إدخال معرّف المعسكر بشكل صحيح", 400));
      }

      query.bootcamp = bootcamp;
      query.type = "bootcamp";
    }

    const subscription = await Subscription.findOne(query).lean();

    if (!subscription) {
      return next(
        new ApiError(
          query.type === "platform"
            ? "يرجى الاشتراك في باقة المنصة للوصول إلى هذه الميزة"
            : "يرجى الاشتراك في باقة المعسكر للوصول إلى هذه الميزة",
          403,
        ),
      );
    }

    if (subscription.endDate < new Date()) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        $set: {
          isActive: false,
        },
      });
      return next(new ApiError("Subscription has expired", 403));
    }
    next();
  } catch (error) {
    next(error);
  }
};
