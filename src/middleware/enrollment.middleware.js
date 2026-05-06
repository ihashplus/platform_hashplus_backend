import Enrollment from "../models/enrollment.model.js";
import { ApiError } from "../utils/apiError.js";

export const checkEnrollment = async (req, res, next) => {
  try {
    let { contentId } = req.params || {};

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      content: contentId,
    });

    if (!enrollment) {
      return next(new ApiError("No enrollment found", 404));
    }

    next();
  } catch (error) {
    next(error);
  }
};
