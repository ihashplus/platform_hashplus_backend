import { Content } from "../models/content.model.js";
import Enrollement from "../models/enrollment.model.js";
import { ApiError } from "../utils/apiError.js";

const getMyEnrollements = async (req, res, next) => {
  try {
    let filter = {};
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const userId = req.user._id;
    const enrollements = await Enrollement.find({
      user: userId,
      ...filter,
    }).populate(
      "content",
      "_id title slug contentType metadata.avgRatings metadata.ratingsCount price thumbnail",
    );

    res.status(200).json({
      success: true,
      message: "data fetched successfully",
      length: enrollements.length,
      data: enrollements,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching data", 500));
  }
};

const addToEnrollements = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { contentId } = req.params || req.body;

    const content = await Content.findById(contentId);
    if (!content) return next(new ApiError("Content not found", 404));

    const enrollement = await Enrollement.findOne({
      user: userId,
      content: contentId,
    });
    if (enrollement) return next(new ApiError("Content already added", 409));

    const newEnrollement = await Enrollement.create({
      user: userId,
      content: contentId,
      type: content.contentType,
    });

    res.status(200).json({
      success: true,
      message: "data added successfully",
      data: newEnrollement,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error adding data", 500));
  }
};

const removeFromEnrollements = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { contentId } = req.params || req.body;

    const enrollement = await Enrollement.findOne({
      user: userId,
      content: contentId,
    });
    if (!enrollement) return next(new ApiError("No enrollement found", 404));

    await Enrollement.findByIdAndDelete(enrollement._id);

    res.status(204).json({
      success: true,
      message: "data deleted successfully",
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error deleting data", 500));
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { contentId } = req.params || req.body;
    const { progress } = req.body;

    const enrollement = await Enrollement.findOneAndUpdate(
      { user: userId, content: contentId },
      [
        {
          $set: {
            progress: {
              $min: [100, { $max: [0, { $add: ["$progress", progress] }] }],
            },
          },
        },
      ],
      { returnDocument: "after" },
    );

    if (!enrollement)
      return next(new ApiError("Learning record not found", 404));

    if (enrollement.progress === 100 && enrollement.status !== "completed") {
      await Enrollement.findByIdAndUpdate(enrollement._id, {
        status: "completed",
        completedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "data updated successfully",
      data: enrollement,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error updating data", 500));
  }
};

export {
  getMyEnrollements,
  addToEnrollements,
  removeFromEnrollements,
  updateProgress,
};
