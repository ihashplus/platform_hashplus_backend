import bcrypt from "bcrypt";
import crypto from "crypto";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { verify } from "../utils/googleAuth.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwtToken.js";

import {
  storeRefreshToken,
  getRefreshToken,
  removeRefreshToken,
} from "../utils/refreshToken.js";

import { sanitizedUser } from "../utils/dataSanitizer.js";

import { JWT_REFRESH_SECRET_KEY, GOOGLE_CLIENT_ID } from "../config/env.js";

// signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // find the user by email
    const user = await User.findOne({ email });
    if (user) {
      return next(
        new ApiError(`البريد الإلكتروني ${user.email} مستخدم من قبل`, 400),
      );
    }

    const validRoles = ["student", "instructor"];
    const selectedRole = role && validRoles.includes(role) ? role : "student";

    // create new user
    const newUser = await User.create({
      name,
      email,
      password,
      role: selectedRole,
    });

    // generate otp
    const random = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .trim();
    const otp = crypto.createHash("sha256").update(random).digest("hex");

    // update user's otp
    newUser.otpCode = otp;
    newUser.otpEat = Date.now() + 10 * 60 * 1000; // otp expires in 10 mins
    await newUser.save();

    // Email Options
    const options = {
      email: newUser.email,
      subject: `رمز التحقق OTP (صالح لمدة 10 دقائق)`,
      message: `مرحبا ${newUser.name},\nلقد أرسلنا الرمز ${random} لإعادة تعيين كلمة المرور الخاصة بك.\n\nفريق هاش بلس`,
    };

    // send otp to newUser's email
    try {
      await sendEmail(options);
    } catch (err) {
      console.log(err);
      newUser.otpCode = undefined;
      newUser.otpEat = undefined;
      await newUser.save();
      return next(
        new ApiError("حدث خطأ اثناء ارسال رمز OTP عبر بريدك الإلكتروني", 500),
      );
    }

    // generate jwt
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    // store refresh token on redis (upstash)
    await storeRefreshToken(newUser._id, refreshToken);

    res.status(201).json({
      status: "success",
      message:
        "تم إنشاء المستخدم بنجاح. يرجى التحقق من رمز OTP المرسل إلى بريدك الإلكتروني.",
      data: sanitizedUser(newUser),
      token: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      return next(new ApiError("البريد الإلكتروني مستخدم من قبل", 400));
    }

    return next(new ApiError("حدث خطأ اثناء إنشاء المستخدم", 500));
  }
};

// request otp
const requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // find the user by email
    const user = await User.findOne({ email });
    if (!user) return next(new ApiError("User not found", 404));

    if (user.otpIsVerified) {
      return next(
        new ApiError(
          "تم التحقق من رمز OTP المرسل إلى بريدك الإلكتروني بالفعل",
          400,
        ),
      );
    }

    if (user.otpEat && user.otpEat > Date.now()) {
      const remainingSeconds = Math.ceil((user.otpEat - Date.now()) / 1000);

      return next(
        new ApiError(
          ` تم إرسال رمز OTP مسبقًا. يرجى الانتظار قبل طلب رمز جديد. الرجاء المحاولة مرة أخرى بعد${remainingSeconds} ثانية.`,
          429,
        ),
      );
    }

    // generate otp
    const random = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .trim();
    const otp = crypto.createHash("sha256").update(random).digest("hex");

    // update user's otp
    user.otpCode = otp;
    user.otpEat = Date.now() + 10 * 60 * 1000; // otp expires in 10 mins
    await user.save();

    // Email Options
    const options = {
      email: user.email,
      subject: `رمز التحقق OTP (صالح لمدة 10 دقائق)`,
      message: `مرحبا ${user.name},\nلقد أرسلنا الرمز ${random} لإعادة تعيين كلمة المرور الخاصة بك.\n\nفريق هاش بلس`,
    };

    // send otp to user's email
    try {
      await sendEmail(options);
    } catch (err) {
      user.otpCode = undefined;
      user.otpEat = undefined;
      await user.save();
      return next(
        new ApiError(
          "حدث خطأ اثناء ارسال رمز OTP عبر بريدك الإلكتروني. يرجى المحاولة مرة اخرى",
          500,
        ),
      );
    }

    res.status(200).json({
      status: "success",
      message: `تم إرسال رمز OTP بنجاح إلى ${user.email}`,
    });
  } catch (error) {
    console.error("Error in requestOtp:", error);
    next(new ApiError("حدث خطأ اثناء ارسال رمز OTP", 500));
  }
};

// verify otp
const verifyOtp = async (req, res, next) => {
  try {
    const { otp, email } = req.body;

    const user = await User.findOne({
      email,
      otpCode: crypto
        .createHash("sha256")
        .update(String(otp).trim())
        .digest("hex"),
      otpEat: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ApiError(
          "هذا الرمز غير صالح او منتهي الصلاحية. يرجى التحقق من رمز OTP المرسل إلى بريدك الإلكتروني",
          400,
        ),
      );
    }

    // update user's otp
    user.otpIsVerified = true;
    await user.save();

    // generate JWT
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // store refresh token on redis (upstash)
    await storeRefreshToken(user._id, refreshToken);

    res.status(200).json({
      success: true,
      message: "تم التحقق من رمز OTP بنجاح",
      token: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    next(new ApiError("حدث خطأ اثناء التحقق من رمز OTP", 500));
  }
};

// login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return next(
        new ApiError("البريد الإلكتروني او كلمة المرور غير صحيحة", 401),
      );
    }

    if (user.authProvider === "google") {
      return res.status(409).json({
        status: "failed",
        message: `تم تسجيل الدخول من خلال حساب جوجل من قبل باستخدام نفس البريد الاكتروني`,
      });
    }

    if (!user.password || !(await user.comparePassword(password))) {
      return next(
        new ApiError("البريد الإلكتروني او كلمة المرور غير صحيحة", 401),
      );
    }

    if (!user.otpIsVerified) {
      return next(
        new ApiError("من قبل تسجيل الدخول، يرجى التحقق من رمز OTP", 400),
      );
    }

    // generate JWT
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // store refresh token on redis (upstash)
    await storeRefreshToken(user._id, refreshToken);

    // update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: sanitizedUser(user),
      token: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Error in login:", error);
    next(new ApiError("حدث خطأ اثناء تسجيل الدخول", 500));
  }
};

// googleAuth
const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new ApiError("توكن الدخول لحساب جوجل مطلوب", 400));
    }

    const payload = await verify(token);

    // Validate audience
    if (payload.aud !== GOOGLE_CLIENT_ID && payload.azp !== GOOGLE_CLIENT_ID) {
      return next(new ApiError("حدث خطأ اثناء التحقق من الحساب", 401));
    }

    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
      email_verified,
    } = payload;

    if (!email_verified) {
      return next(new ApiError("بريد جوجل الألكتروني غير مفعل", 401));
    }

    // ✅ Now safe to trust the data
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        googleId,
        name,
        avatar,
        authProvider: "google",
        otpIsVerified: true,
      });
    } else if (user && !user.googleId) {
      user.googleId = googleId;
      user.name = name;
      user.avatar = avatar;
      user.authProvider = "google";
      user.otpIsVerified = true;
      await user.save();
    }

    // generate JWTs
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await storeRefreshToken(user._id, refreshToken);

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: sanitizedUser(user),
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Error in googleAuth:", err);
    next(new ApiError("حدث خطأ اثناء تسجيل الدخول بحساب جوجل", 500));
  }
};

// logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.headers["x-refresh-token"];

    if (refreshToken) {
      try {
        const decoded = await verifyToken(refreshToken, JWT_REFRESH_SECRET_KEY);

        // Remove the user's refresh token from Redis
        await removeRefreshToken(decoded.userId);
      } catch (err) {
        // Invalid or expired refresh token → ignore but return success (session already invalid)
        console.error("Error removing refresh token", err);
      }
    }

    res.status(200).json({
      status: "success",
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.error("Error in logout:", error);
    return next(new ApiError("حدث خطأ اثناء تسجيل الخروج", 500));
  }
};

// refresh token
const refreshToken = async (req, res, next) => {
  try {
    const oldRefreshToken = req.headers["x-refresh-token"];

    if (!oldRefreshToken) {
      return next(new ApiError("Refresh token not provided", 400));
    }

    // Verify the token (will throw if expired or invalid)
    const decoded = await verifyToken(oldRefreshToken, JWT_REFRESH_SECRET_KEY);

    const storedRefresh = await getRefreshToken(decoded.userId);

    if (!storedRefresh || storedRefresh !== oldRefreshToken) {
      return next(new ApiError("Invalid refresh token", 401));
    }

    const user = await User.findById(decoded.userId).select(
      "otpIsVerified isActive",
    );
    if (!user || !user.otpIsVerified || !user.isActive) {
      return next(new ApiError("Account not verified or inactive", 403));
    }

    // Token is valid → ROTATE refresh token
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    // Update Redis
    await removeRefreshToken(decoded.userId);
    await storeRefreshToken(decoded.userId, newRefreshToken);

    res.status(200).json({
      status: "success",
      message: "Tokens refreshed successfully",
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Error in refreshToken:", err);
    return next(new ApiError("Invalid or expired refresh token", 401));
  }
};

// forgotPassword
const forgotPassword = async (req, res, next) => {
  try {
    // Check user
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new ApiError("User not found", 404));

    // generate reset code
    const random = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .trim();
    const resetCode = crypto.createHash("sha256").update(random).digest("hex");

    // 3) Save the reset code in the database
    user.passResetCode = resetCode; // reset code
    user.passResetCodeEat = Date.now() + 10 * 60 * 1000; // reset code expires  in 10 mins
    user.passResetCodeVerified = false; //  set reset code as unverified
    await user.save();

    // Email Options
    const options = {
      email: user.email,
      subject: `اعادة تعيين كلمة المرور - رمز التحقق OTP (صالح لمدة 10 دقائق)`,
      message: `مرحبا ${user.name},\nلقد أرسلنا الرمز ${random} لإعادة تعيين كلمة المرور الخاصة بك.\n\nفريق هاش بلس`,
    };

    // Sending Email
    try {
      await sendEmail(options);
    } catch (err) {
      user.passResetCode = undefined;
      user.passResetCodeEat = undefined;
      user.passResetCodeVerified = undefined;
      await user.save();
      console.error("Error in forgotPassword email:", err);
      return next(new ApiError("حدث خطأ اثناء ارسال رمز التحقق", 500));
    }

    res.status(200).json({
      status: "success",
      message: `تم إرسال رمز التحقق بنجاح إلى ${user.email}. يرجى التحقق من بريدك الإلكتروني.`,
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return next(new ApiError("حدث خطأ اثناء استعادة كلمة المرور", 500));
  }
};

// verifyResetCode
const verifyResetCode = async (req, res, next) => {
  try {
    const { resetCode, email } = req.body;

    const user = await User.findOne({
      email,
      passResetCode: crypto
        .createHash("sha256")
        .update(String(resetCode).trim())
        .digest("hex"),
      passResetCodeEat: { $gt: Date.now() },
    });

    if (!user)
      return next(new ApiError("رمز التحقق غير صالح أو منتهي الصلاحية", 400));

    user.passResetCodeVerified = true;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "تم التحقق من رمز التحقق بنجاح" });
  } catch (error) {
    console.error("Error in verifyResetCode:", error);
    return next(new ApiError("حدث خطأ اثناء التحقق من رمز التحقق", 500));
  }
};

// resetPassword
const resetPassword = async (req, res, next) => {
  try {
    // Check user
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user?.passResetCodeVerified) {
      return next(new ApiError("من فضلك قم بالتحقق من رمز التحقق اولا", 400));
    }

    const newPassword = await bcrypt.hash(req.body.newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: newPassword,
      passResetCode: undefined,
      passResetCodeEat: undefined,
      passResetCodeVerified: undefined,
      passwordChangedAt: Date.now(),
    });

    // Invalidate previous refresh tokens
    await removeRefreshToken(user._id);

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await storeRefreshToken(user._id, refreshToken);

    res.status(200).json({
      status: "success",
      message: "تم إعادة تعيين كلمة المرور بنجاح",
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return next(new ApiError("حدث خطأ اثناء استعادة كلمة المرور", 500));
  }
};

export {
  signup,
  verifyOtp,
  requestOtp,
  login,
  googleAuth,
  logout,
  refreshToken,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
