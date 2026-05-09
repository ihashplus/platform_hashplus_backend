import slugify from "slugify";
import { Content } from "../models/content.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import ApiFeatures from "../utils/apiFeatures.js";
import { cascadeDeleteContent } from "../utils/cascadeDelete.js";

const getContents = async (req, res, next) => {
  try {
    // Nested Route
    let filter = {};
    if (req.params.categoryId) filter = { category: req.params.categoryId };

    // Build the query
    const numOfDocument = await Content.countDocuments(filter);
    const apiFeatures = new ApiFeatures(Content.find(filter), req.query)
      .paginate(numOfDocument)
      .filter()
      .limitFields()
      .search("Content")
      .sort();

    const { mongooseQuery, pagination } = apiFeatures;

    // Excute the query
    const docs = await mongooseQuery;

    res.status(200).json({
      status: "success",
      message: "Contents fetched successfully",
      result: docs.length,
      pagination,
      data: docs,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError(error.message || "Error fetching contents", 500));
  }
};

const getContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const content = await Content.findById(contentId)
      .populate({
        path: "reviews",
        select: "_id review rating user",
      })
      .populate({
        path: "instructor",
        select: "_id name profileImage",
      })
      .populate({
        path: "category",
        select: "_id name",
      })
      .lean();

    if (!content) {
      return next(new ApiError("Content not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Content fetched successfully",
      data: content,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError(error.message || "Error fetching content", 500));
  }
};

const createContent = async (req, res, next) => {
  try {
    const {
      contentType,
      title,
      category,
      instructor,
      description,
      learningOutcomes,
      prerequisites,
      welcomeMessage,
      congratulationsMessage,
      level,
      language,
      materials,
      price,
      thumbnail,
      welcomeVideo,
      finalProject,
      startDate,
      endDate,
      totalProjects,
    } = req.body;

    const slug = slugify(title, { lower: true, trim: true });

    const content = await Content.findOne({ slug });
    if (content) {
      return next(new ApiError("Content already exists", 400));
    }

    const finalInstructor = instructor || req.user?._id;

    const newContent = await Content.create({
      title,
      slug,
      contentType,
      category,
      instructor: finalInstructor,
      description,
      learningOutcomes,
      prerequisites,
      welcomeMessage,
      congratulationsMessage,
      level,
      language,
      materials,
      price,
      thumbnail: thumbnail ? { ...thumbnail, uploadedAt: new Date() } : null,
      welcomeVideo: welcomeVideo
        ? { ...welcomeVideo, uploadedAt: new Date() }
        : null,
      finalProject,
      startDate:
        contentType === "bootcamp" && startDate ? new Date(startDate) : null,
      endDate: contentType === "bootcamp" && endDate ? new Date(endDate) : null,
      totalProjects: contentType === "bootcamp" ? totalProjects : null,
    });

    res.status(201).json({
      status: "success",
      message: "Content created successfully",
      data: newContent,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return next(new ApiError(error.message, 400));
    }
    next(new ApiError(error.message || "Error creating content", 500));
  }
};

const updateContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const {
      title,
      category,
      description,
      learningOutcomes,
      prerequisites,
      welcomeMessage,
      congratulationsMessage,
      level,
      language,
      materials,
      price,
      thumbnail,
      welcomeVideo,
      finalProject,
      startDate,
      endDate,
      totalProjects,
    } = req.body || {};
    const slug = title
      ? slugify(title, { lower: true, trim: true })
      : undefined;

    if (slug) {
      const existing = await Content.findOne({ slug, _id: { $ne: contentId } });
      if (existing)
        return next(
          new ApiError("A content with this title already exists", 400),
        );
    }

    const content = await Content.findById(contentId);
    if (!content) {
      return next(new ApiError("Content not found", 404));
    }

    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== content.instructor.toString()
    ) {
      return next(
        new ApiError("You are not authorized to update this content", 403),
      );
    }

    const updates = Object.fromEntries(
      Object.entries({
        title,
        slug,
        category,
        description,
        learningOutcomes,
        prerequisites,
        welcomeMessage,
        congratulationsMessage,
        level,
        language,
        materials,
        price,
        thumbnail: thumbnail ? { ...thumbnail, uploadedAt: new Date() } : null,
        welcomeVideo: welcomeVideo
          ? { ...welcomeVideo, uploadedAt: new Date() }
          : null,
        finalProject,
        startDate:
          content.contentType === "bootcamp" && startDate
            ? new Date(startDate)
            : null,
        endDate:
          content.contentType === "bootcamp" && endDate
            ? new Date(endDate)
            : null,
        totalProjects:
          content.contentType === "bootcamp" ? totalProjects : null,
      }).filter(([, v]) => v !== undefined),
    );
    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      { $set: updates },
      { returnDocument: "after" },
    );

    res.status(200).json({
      status: "success",
      message: "Content updated successfully",
      data: updatedContent,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError(error.message || "Error updating content", 500));
  }
};

const deleteContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    // Find first to confirm existence and capture instructor reference
    const content = await Content.findById(contentId);
    if (!content) {
      return next(new ApiError("Content not found", 404));
    }

    // Clean up all dependent records before deleting the parent
    await cascadeDeleteContent(contentId);

    // Delete the content document
    await Content.findByIdAndDelete(contentId);

    // Also update the instructor's createdContent array
    await User.findByIdAndUpdate(content.instructor, {
      $pull: { "instructorDetails.createdContent": content._id },
      $inc: { "instructorDetails.totalCreatedContent": -1 },
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    next(new ApiError("Error deleting content", 500));
  }
};

export { getContents, getContent, createContent, updateContent, deleteContent };
