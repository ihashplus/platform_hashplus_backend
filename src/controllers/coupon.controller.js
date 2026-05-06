import Coupon from "../models/coupon.model.js";
import { Content, Bootcamp, Course } from "../models/content.model.js";
import { ApiError } from "../utils/apiError.js";
import ApiFeatures from "../utils/apiFeatures.js";

const validateCoupon = async (req, res, next) => {
  try {
    let { code, originalAmount, contentType, contentId } = req.body;
    const userId = req.user._id;
    code = code?.trim().toUpperCase();

    if (!code || originalAmount === undefined) {
      return next(new ApiError("الكود والمبلغ الأصلي مطلوبان", 400));
    }

    const coupon = await Coupon.findOne({ code, status: "active" });

    if (!coupon) {
      return next(new ApiError("الكوبون غير صالح أو غير مفعل", 400));
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.expiresAt) {
      return next(new ApiError("الكوبون منتهي الصلاحية أو لم يبدأ بعد", 400));
    }

    if (coupon.usageLimit) {
      const totalUses = coupon.usageCounter.reduce(
        (acc, curr) => acc + curr.count,
        0,
      );
      if (totalUses >= coupon.usageLimit) {
        return next(
          new ApiError("تم الوصول للحد الأقصى لاستخدام هذا الكوبون", 400),
        );
      }
    }

    if (coupon.usageLimitPerUser) {
      const userUsage = coupon.usageCounter.find(
        (u) => u.user.toString() === userId.toString(),
      );
      if (userUsage && userUsage.count >= coupon.usageLimitPerUser) {
        return next(
          new ApiError("لقد تجاوزت الحد الأقصى لاستخدام هذا الكوبون", 400),
        );
      }
    }

    // Check includes
    if (coupon.includes) {
      if (
        contentType &&
        coupon.includes.contentType &&
        coupon.includes.contentType !== contentType
      ) {
        return next(
          new ApiError("هذا الكوبون غير صالح لهذا النوع من المحتوى", 400),
        );
      }
      if (
        contentId &&
        coupon.includes.contentIds &&
        coupon.includes.contentIds.length > 0
      ) {
        const isIncluded = coupon.includes.contentIds.some(
          (id) => id.toString() === contentId.toString(),
        );
        if (!isIncluded) {
          return next(new ApiError("هذا الكوبون غير صالح لهذا المحتوى", 400));
        }
      }
    }

    // Check excludes
    if (coupon.excludes) {
      if (
        contentType &&
        coupon.excludes.contentType &&
        coupon.excludes.contentType === contentType
      ) {
        return next(
          new ApiError("هذا الكوبون غير صالح لهذا النوع من المحتوى", 400),
        );
      }
      if (
        contentId &&
        coupon.excludes.contentIds &&
        coupon.excludes.contentIds.length > 0
      ) {
        const isExcluded = coupon.excludes.contentIds.some(
          (id) => id.toString() === contentId.toString(),
        );
        if (isExcluded) {
          return next(new ApiError("هذا الكوبون غير صالح لهذا المحتوى", 400));
        }
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (originalAmount * coupon.discountValue) / 100;
      if (
        coupon.maxDiscountAmount &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed the original amount
    if (discountAmount > originalAmount) {
      discountAmount = originalAmount;
    }

    const finalAmount = originalAmount - discountAmount;

    res.status(200).json({
      status: "success",
      data: {
        originalAmount,
        discountAmount,
        finalAmount,
        couponId: coupon._id,
      },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء تطبيق الكوبون", 500));
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      startDate,
      expiresAt,
      usageLimit,
      usageLimitPerUser,
      includes,
      excludes,
    } = req.body;

    if (code) {
      const existingCoupon = await Coupon.findOne({
        code: `${code}`.trim().toUpperCase(),
      });
      if (existingCoupon) {
        return next(new ApiError("هذا الكوبون موجود بالفعل", 400));
      }
    }

    if (includes?.contentType === "platform") {
      if (includes?.contentIds?.length > 0) {
        const content = await Content.find({
          _id: { $in: includes?.contentIds },
        });
        if (content.length !== includes?.contentIds.length) {
          return next(new ApiError("بعض الكورسات غير موجودة", 400));
        }
      }
    }

    if (includes?.contentType === "bootcamp") {
      if (includes?.contentIds?.length > 0) {
        const bootcamp = await Bootcamp.find({
          _id: { $in: includes?.contentIds },
        });
        if (bootcamp.length !== includes?.contentIds.length) {
          return next(new ApiError("بعض المعسكرات غير موجودة", 400));
        }
      }
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      startDate,
      expiresAt,
      usageLimit,
      usageLimitPerUser,
      includes,
      excludes,
    });
    res.status(201).json({
      status: "success",
      data: { coupon },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء إنشاء الكوبون", 500));
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return next(new ApiError("الكوبون غير موجود", 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء حذف الكوبون", 500));
  }
};

const getCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return next(new ApiError("الكوبون غير موجود", 404));
    }
    res.status(200).json({
      status: "success",
      data: { coupon },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء استرجاع الكوبون", 500));
  }
};

const getCoupons = async (req, res, next) => {
  try {
    const totalDocuments = await Coupon.countDocuments();
    const apiFeatures = new ApiFeatures(Coupon.find(), req.query)
      .filter()
      .search("Coupon")
      .sort()
      .limitFields()
      .paginate(totalDocuments);

    const coupons = await apiFeatures.mongooseQuery;

    res.status(200).json({
      status: "success",
      results: coupons.length,
      pagination: apiFeatures.pagination,
      data: { coupons },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء استرجاع الكوبونات", 500));
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      startDate,
      expiresAt,
      usageLimit,
      usageLimitPerUser,
      includes,
      excludes,
    } = req.body;

    if (code) {
      const existingCoupon = await Coupon.findOne({
        code: `${code}`.trim().toUpperCase(),
        _id: { $ne: id },
      });
      if (existingCoupon) {
        return next(new ApiError("هذا الكوبون موجود بالفعل", 400));
      }
    }

    if (includes?.contentType === "platform") {
      if (includes?.contentIds?.length > 0) {
        const content = await Content.find({
          _id: { $in: includes?.contentIds },
        });
        if (content.length !== includes?.contentIds.length) {
          return next(new ApiError("بعض الكورسات غير موجودة", 400));
        }
      }
    }

    if (includes?.contentType === "bootcamp") {
      if (includes?.contentIds?.length > 0) {
        const bootcamp = await Bootcamp.find({
          _id: { $in: includes?.contentIds },
        });
        if (bootcamp.length !== includes?.contentIds.length) {
          return next(new ApiError("بعض المعسكرات غير موجودة", 400));
        }
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        code: code?.trim().toUpperCase(),
        discountType,
        discountValue,
        maxDiscountAmount,
        startDate,
        expiresAt,
        usageLimit,
        usageLimitPerUser,
        includes,
        excludes,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
    if (!coupon) {
      return next(new ApiError("الكوبون غير موجود", 404));
    }
    res.status(200).json({
      status: "success",
      data: { coupon },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء تعديل الكوبون", 500));
  }
};

export {
  validateCoupon,
  createCoupon,
  deleteCoupon,
  getCoupon,
  getCoupons,
  updateCoupon,
};
