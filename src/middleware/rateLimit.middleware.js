import rateLimit from "express-rate-limit";

// General API limit — loose, protects against scrapers
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests, please try again later.",
  },
});

// Strict limit for login — prevents password brute force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many login attempts, please try again in 15 minutes.",
  },
});

// OTP limit — prevents email flooding and OTP brute force
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // matches OTP TTL
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many OTP requests, please try again later.",
  },
});

// Password reset — prevents reset code enumeration
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many password reset attempts, please try again later.",
  },
});
