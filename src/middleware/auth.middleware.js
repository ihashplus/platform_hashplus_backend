import JWT from "jsonwebtoken";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import { JWT_ACCESS_SECRET_KEY } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { sendEmail } from "../utils/sendEmail.js";

const guard = async (req, res, next) => {
  // 1) Check if token exists in request
  let token = null;

  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2) If no token is found, return an error
  if (!token) {
    return next(new ApiError("لم يتم توفر توكن. يرجى تسجيل الدخول", 401));
  }

  try {
    // 3) Verify the token
    const decoded = await JWT.verify(token, JWT_ACCESS_SECRET_KEY);

    // 4) Find the user based on decoded token
    const loggedUser = await User.findById(decoded.userId).select("-password");

    if (!loggedUser) {
      return next(
        new ApiError(
          "حدث خطأ في التحقق من التوكن: المستخدم غير موجود. يرجى تسجيل الدخول مرة اخرى.",
          404,
        ),
      );
    }

    // 4.b) Check if user is active
    if (!loggedUser.isActive) {
      return next(
        new ApiError("حسابك معطل. يرجى الاتصال بالدعم للمساعدة.", 403),
      );
    }

    // 4.c) Check if otp is verified for users who haven't verified yet
    if (!loggedUser.otpIsVerified) {
      return next(
        new ApiError(
          "لم يتم التحقق من OTP الخاص بك. يرجى التحقق من OTP للمتابعة.",
          403,
        ),
      );
    }

    // 4.d) Check if user changed password after the token was issued
    if (loggedUser.passwordChangedAt) {
      const passwordChangedTimestamp = parseInt(
        loggedUser.passwordChangedAt.getTime() / 1000,
        10,
      );
      if (decoded.iat < passwordChangedTimestamp) {
        return next(
          new ApiError(
            "تم تغيير كلمة المرور الخاصة بك مؤخرًا. يرجى تسجيل الدخول مرة أخرى.",
            401,
          ),
        );
      }
    }

    // 5) Attach the user to the request object for future middleware or routes
    req.user = loggedUser;

    // 6) Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification error:", error);

    return next(
      new ApiError("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة اخرى", 401),
    );
  }
};

const allowedTo =
  (...roles) =>
  async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("غير مسموح لك بالوصول لهذه الصفحة", 403));
    }

    next();
  };

export { guard, allowedTo };
