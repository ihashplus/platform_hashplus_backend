import mongoose from "mongoose";
import ApiFeatures from "../utils/apiFeatures.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import Subscription from "../models/subscription.model.js";
import { Content } from "../models/content.model.js";
import Review from "../models/review.model.js";

//------------------------Dashboard------------------------

// Get Dashboard Stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      studentsCount,
      instructorsCount,
      coursesCount,
      bootcampsCount,
      topStudentsByEnrollment,
      popularInstructors,
      students,
      instructors,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Content.countDocuments({ contentType: "course" }),
      Content.countDocuments({ contentType: "bootcamp" }),
      // Most students in learning programs by progress
      Enrollment.aggregate([
        {
          $group: {
            _id: "$user",
            contentCount: { $sum: 1 },
            avgProgress: { $avg: "$progress" },
            totalProgress: { $sum: "$progress" },
          },
        },
        {
          $sort: { totalProgress: -1 },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: {
            path: "$student",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            studentId: "$_id",
            name: "$student.name",
            email: "$student.email",
            coursesCount: 1,
            avgProgress: { $round: ["$avgProgress", 0] },
            totalProgress: 1,
          },
        },
      ]),
      // Most popular instructors that students learn from them
      Enrollment.aggregate([
        {
          $lookup: {
            from: "contents",
            localField: "content",
            foreignField: "_id",
            as: "contentDoc",
          },
        },
        {
          $unwind: {
            path: "$contentDoc",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$contentDoc.instructor",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "instructor",
          },
        },
        {
          $unwind: {
            path: "$instructor",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            instructorId: "$_id",
            name: "$instructor.name",
            email: "$instructor.email",
            count: 1,
          },
        },
      ]),
      User.find({ role: "student" }).select("-password").limit(10),
      User.find({ role: "instructor" })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const usersCount = studentsCount + instructorsCount;
    const contentCount = coursesCount + bootcampsCount;

    res.status(200).json({
      status: "success",
      message: "تم جلب إحصائيات لوحة التحكم بنجاح",
      data: {
        contentCount,
        coursesCount,
        bootcampsCount,
        usersCount,
        studentsCount,
        instructorsCount,
        students,
        instructors,
        topStudentsByEnrollment,
        popularInstructors,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return next(new ApiError("حدث خطأ اثناء جلب إحصائيات لوحة التحكم", 500));
  }
};

// Get Dashboard Analytics
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      coursesCount,
      bootcampsCount,
      studentsCount,
      instructorsCount,
      popularCategories,
    ] = await Promise.all([
      Content.countDocuments({ contentType: "course" }),
      Content.countDocuments({ contentType: "bootcamp" }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Content.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            categoryId: "$_id",
            name: "$category.name",
            slug: "$category.slug",
            count: 1,
          },
        },
      ]),
    ]);

    const contentCount = coursesCount + bootcampsCount;
    const usersCount = studentsCount + instructorsCount;

    res.status(200).json({
      status: "success",
      message: "تم جلب تحليلات لوحة التحكم بنجاح",
      data: {
        contentCount,
        coursesCount,
        bootcampsCount,
        usersCount,
        studentsCount,
        instructorsCount,
        popularCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return next(new ApiError("حدث خطأ اثناء جلب تحليلات لوحة التحكم", 500));
  }
};

//------------------------Users------------------------

// Create User (Admin Only)
const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      bio,
      links,
      languages,
      skills,
      education,
      experience,
      studentDetails,
      instructorDetails,
    } = req.body;

    const user = await User.findOne({ email });
    if (user) return next(new ApiError("User already exists", 400));

    const student = await User.create({
      name,
      email,
      password,
      role: role,
      phone,
      languages,
      bio,
      links,
      skills,
      education,
      experience,
      studentDetails,
      instructorDetails,
      otpIsVerified: true,
    });

    res.status(201).json({
      status: "success",
      message: "تم إنشاء المستخدم بنجاح",
      data: student,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return next(new ApiError(`Error creating user: ${error.message}`, 500));
  }
};

// Get All User Profiles
const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query || {};

    // Build the query
    const numOfDocument = await User.countDocuments();
    const apiFeatures = new ApiFeatures(
      User.find(role ? { role } : {}).select("-password"),
      req.query,
    )
      .paginate(numOfDocument)
      .filter()
      .limitFields()
      .search("User")
      .sort();

    const { mongooseQuery, pagination } = apiFeatures;

    // Excute the query
    const docs = await mongooseQuery;

    res.status(200).json({
      status: "success",
      message: "تم جلب جميع المستخدمين بنجاح",
      result: docs.length,
      pagination,
      data: docs,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return next(new ApiError("حدث خطأ اثناء جلب جميع المستخدمين", 500));
  }
};

// Get Student By ID with Learning and Subscription (Admin Only)
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password").lean();
    if (!user) return next(new ApiError("User not found", 404));

    let data = {};

    if (user.role === "student") {
      const learning = await Learning.find({ user: userId }).lean();
      const subscription = await Subscription.find({
        user: userId,
      }).lean();

      data = {
        student: user,
        learning: {
          coursesLearning: learning?.filter((learn) => learn.type === "course"),
          bootcampsLearning: learning?.filter(
            (learn) => learn.type === "bootcamp",
          ),
        },
        subscriptions: {
          generalSubscription: subscription?.filter(
            (sub) => sub.type === "general",
          ),
          bootcampSubscription: subscription?.filter(
            (sub) => sub.type === "bootcamp",
          ),
        },
      };
    } else if (user.role === "instructor") {
      const content = await Content.find({ instructor: userId }).lean();

      data = {
        instructor: user,
        content: {
          courses: content?.filter((c) => c.contentType === "course"),
          bootcamps: content?.filter((c) => c.contentType === "bootcamp"),
        },
      };
    } else if (user.role === "admin") {
      data = {
        admin: user,
      };
    }

    res.status(200).json({
      status: "success",
      message: "تم جلب بيانات المستخدم بنجاح",
      data,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return next(new ApiError(`Error fetching user: ${error.message}`, 500));
  }
};

// Toggle User isActive Status (Admin Only)
const toggleUserIsActive = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("isActive");
    if (!user) return next(new ApiError("User not found", 404));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: !user.isActive },
      { returnDocument: "after", select: "-password" },
    ).lean();

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error toggling user active status:", error);
    return next(
      new ApiError(`Error toggling user active: ${error.message}`, 500),
    );
  }
};

//------------------------Content------------------------

// Get All Content (Admin Only)
const getAllContent = async (req, res, next) => {
  try {
    const { contentType } = req.query || {};

    // Build the query
    const numOfDocument = await Content.countDocuments();
    const apiFeatures = new ApiFeatures(
      Content.find(contentType ? { contentType } : {}),
      req.query,
    )
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
      message: "تم جلب جميع المحتوى بنجاح",
      result: docs.length,
      pagination,
      data: docs,
    });
  } catch (error) {
    console.error("Error fetching all content:", error);
    return next(
      new ApiError(`Error fetching all content: ${error.message}`, 500),
    );
  }
};

const getContentById = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId).lean();
    if (!content) return next(new ApiError("Content not found", 404));

    const [metadataAgg, numOfLearningDocument] = await Promise.all([
      // Calculate metadata separately
      Learning.aggregate([
        { $match: { content: new mongoose.Types.ObjectId(contentId) } },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDoc",
          },
        },
        { $unwind: "$userDoc" },
        { $match: { "userDoc.isSubscribed": true } },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            totalCompleted: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            totalInProgress: {
              $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
            },
          },
        },
      ]),
      Learning.countDocuments({
        content: contentId,
      }),
    ]);

    const meta = metadataAgg[0] || {
      totalStudents: 0,
      totalCompleted: 0,
      totalInProgress: 0,
    };

    // Use ApiFeatures for students list (paginated, sorted, filtered)
    const apiFeatures = new ApiFeatures(
      Learning.find({ content: contentId }).populate(
        "user",
        "_id name email isSubscribed",
      ),
      req.query,
    )
      .paginate(numOfLearningDocument)
      .filter()
      .sort();

    const { mongooseQuery, pagination } = apiFeatures;
    const contentLearning = await mongooseQuery.lean();

    const userIds = contentLearning
      .map((learn) => learn.user?._id)
      .filter(Boolean);

    const contentRating = await Review.find({
      content: contentId,
      user: { $in: userIds },
    }).lean();

    const studentsMap = {};

    contentLearning.forEach((learn) => {
      if (learn.user && learn.user.isSubscribed) {
        const userId = learn.user._id.toString();
        studentsMap[userId] = {
          _id: learn.user._id,
          name: learn.user.name,
          email: learn.user.email,
          status: learn.status,
          progress: learn.progress,
          rating: null,
          review: null,
        };
      }
    });

    contentRating.forEach((review) => {
      const userId = review.user.toString();
      if (studentsMap[userId]) {
        studentsMap[userId].rating = review.rating;
        studentsMap[userId].review = review.review;
      }
    });

    const students = Object.values(studentsMap);

    res.status(200).json({
      status: "success",
      message: "تم جلب المحتوى بنجاح",
      pagination,
      data: {
        totalStudents: meta.totalStudents,
        totalCompletedStudents: meta.totalCompleted,
        totalInProgressStudents: meta.totalInProgress,
        content,
        students,
      },
    });
  } catch (error) {
    console.error("Error fetching content by ID:", error);
    return next(new ApiError(`Error fetching content: ${error.message}`, 500));
  }
};

export {
  getAllUsers,
  toggleUserIsActive,
  createUser,
  getUserById,
  getAllContent,
  getContentById,
  getDashboardStats,
  getDashboardAnalytics,
};
