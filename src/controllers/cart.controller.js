import Cart from "../models/cart.model.js";
import { Bootcamp } from "../models/content.model.js";
import { ApiError } from "../utils/apiError.js";

export const addBootcampToCart = async (req, res, next) => {
  try {
    const { bootcampId } = req.params;
    const userId = req.user._id;

    const bootcamp = await Bootcamp.findById(bootcampId);
    if (!bootcamp) {
      return next(new ApiError("البوتكامب غير موجود", 404));
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        bootcamps: [bootcampId],
      });
    } else {
      // Avoid duplicates
      const isBootcampInCart = cart.bootcamps.some(
        (id) => id.toString() === bootcampId.toString(),
      );

      if (!isBootcampInCart) {
        cart.bootcamps.push(bootcampId);
        await cart.save();
      }
    }

    res.status(200).json({
      status: "success",
      message: "تم إضافة البوتكامب إلى السلة",
      data: { cart },
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    next(new ApiError("حدث خطأ أثناء الإضافة للسلة", 500));
  }
};

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "bootcamps",
      select: "title thumbnail price instructor duration",
    });

    if (!cart) {
      return res.status(200).json({
        status: "success",
        data: {
          cart: {
            user: userId,
            bootcamps: [],
          },
        },
      });
    }

    res.status(200).json({
      status: "success",
      message: "تم استرجاع السلة",
      cartItems: cart.bootcamps.length,
      data: { cart },
    });
  } catch (error) {
    console.error("Error getting cart:", error);
    next(new ApiError("حدث خطأ أثناء استرجاع السلة", 500));
  }
};

export const removeBootcampFromCart = async (req, res, next) => {
  try {
    const { bootcampId } = req.params;
    const userId = req.user._id;

    const bootcamp = await Bootcamp.findById(bootcampId);
    if (!bootcamp) {
      return next(new ApiError("البوتكامب غير موجود", 404));
    }

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { bootcamps: bootcampId } },
      { returnDocument: "after" },
    );

    if (!cart) {
      return next(new ApiError("السلة غير موجودة", 404));
    }

    res.status(200).json({
      status: "success",
      message: "تم إزالة البوتكامب من السلة",
      data: { cart },
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    next(new ApiError("حدث خطأ أثناء الإزالة من السلة", 500));
  }
};
