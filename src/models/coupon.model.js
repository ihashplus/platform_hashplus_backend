import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code required"],
      unique: [true, "Coupon code must be unique"],
      minlength: [3, "Too short coupon code"],
      maxlength: [32, "Too long coupon code"],
    },

    // discount type (percentage or fixed amount)
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    // discount value (percentage or fixed amount)
    discountValue: {
      type: Number,
      required: [true, "Coupon discount required"],
      min: [1, "Too small discount"],
      max: [100, "Too big discount"],
    },
    // maximum discount amount
    maxDiscountAmount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: [true, "Coupon start date required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Coupon expiration date required"],
    },
    // coupon status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    usageLimit: {
      type: Number,
    },

    usageLimitPerUser: {
      type: Number,
    },

    includes: {
      contentType: {
        type: String,
        enum: ["platform", "bootcamp"],
      },
      // content Ids
      contentIds: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
      },
    },

    excludes: {
      contentType: {
        type: String,
        enum: ["platform", "bootcamp"],
      },
      // content Ids
      contentIds: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],
      },
    },

    usageCounter: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          count: {
            type: Number,
            default: 0,
          },
        },
      ],
    },

    // total discount amount
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

couponSchema.pre("save", function () {
  if (this.code) {
    this.code = `${this.code}`.trim().toUpperCase();
  }
});

couponSchema.index({ code: 1, status: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
