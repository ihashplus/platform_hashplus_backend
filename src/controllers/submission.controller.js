import { Content } from "../models/content.model.js";
import { ApiError } from "../utils/apiError.js";
import { calculateScore } from "../utils/calculateScore.js";

import { Submission } from "../models/submission.model.js";

const submitQuiz = async (req, res, next) => {
  try {
    const { sectionId, contentId, moduleId } = req.params;

    const { data } = req.body || [];

    const content = await Content.findById(contentId);

    if (!content) {
      return next(new ApiError("No Content found with this id.", 404));
    }

    const section = content.sections.id(sectionId);

    if (!section) {
      return next(new ApiError("No section found with this id.", 404));
    }

    console.log(section);

    const module = section.modules.id(moduleId);

    if (!module) {
      return next(new ApiError("No module found with this id.", 404));
    }

    let submission = await Submission.findOne({
      user: req.user._id,
      content: contentId,
    });

    if (!submission) {
      submission = await Submission.create({
        user: req.user._id,
        content: contentId,
      });
    }

    // check if the submitted quizzes are valid
    const isValid = data.every((item) =>
      module.quiz
        .map((quiz) => quiz._id?.toString())
        .includes(item._id?.toString()),
    );

    if (!isValid) {
      return next(new ApiError("Invalid quiz IDs.", 400));
    }

    let quizSubmission = submission.quizSubmissions.find(
      (quiz) => quiz.moduleId.toString() === moduleId,
    );

    if (quizSubmission) {
      let quizSub = submission.quizSubmissions.id(quizSubmission._id);
      const { score, status } = calculateScore(module.quiz, data);
      quizSub.set({
        sectionId: sectionId,
        moduleId: moduleId,
        data: [...data],
        score: score,
        status: status,
      });
    } else {
      const { score, status } = calculateScore(module.quiz, data);
      submission.quizSubmissions.push({
        sectionId: sectionId,
        moduleId: moduleId,
        data: [...data],
        score: score,
        status: status,
      });
    }

    await submission.save();

    res.status(201).json({
      status: "success",
      message: "Answers saved successfully!",
      data: submission.quizSubmissions,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error saving answers.", 400));
  }
};

const submitTask = async (req, res, next) => {
  try {
    const { contentId, sectionId, moduleId } = req.params;

    const { url, image, description } = req.body || {};
    const data = { sectionId, moduleId, url, image, description };

    const content = await Content.findById(contentId);

    if (!content) {
      return next(new ApiError("No Content found with this id.", 404));
    }

    const section = content.sections.id(sectionId);

    if (!section) {
      return next(new ApiError("No section found with this id.", 404));
    }

    const module = section.modules.id(moduleId);

    if (!module) {
      return next(new ApiError("No module found with this id.", 404));
    }

    let submission = await Submission.findOne({
      user: req.user._id,
      content: contentId,
    });

    if (!submission) {
      submission = await Submission.create({
        user: req.user._id,
        content: contentId,
      });
    }

    let taskSubmission = submission.taskSubmissions.find(
      (task) => task.moduleId.toString() === moduleId,
    );

    if (taskSubmission) {
      let taskSub = submission.taskSubmissions.id(taskSubmission._id);
      taskSub.set({ ...data, uploadedAt: new Date() });
    } else {
      submission.taskSubmissions.push({ ...data, uploadedAt: new Date() });
    }

    await submission.save();

    res.status(201).json({
      status: "success",
      message: "Task saved successfully!",
      data: submission.taskSubmissions,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error saving answers.", 400));
  }
};

const submitFinalProject = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const { links, notes } = req.body || {};

    const content = await Content.findById(contentId);

    if (!content) {
      return next(new ApiError("No Content found with this id.", 404));
    }

    const existingSubmission = await Submission.findOne({
      user: req.user._id,
      content: contentId,
      finalProjectSubmission: { $exists: true, $ne: null },
    });

    if (existingSubmission) {
      return next(
        new ApiError("You have already submitted your final project.", 400),
      );
    }
    const submission = await Submission.findOneAndUpdate(
      { user: req.user._id, content: contentId },
      { $set: { finalProjectSubmission: { links, notes } } },
      { upsert: true, returnDocument: "after" },
    );

    // update the progress for the learning model

    res.status(201).json({
      status: "success",
      message: "Final Project Completed!",
      data: submission.finalProjectSubmission,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error completing final project", 500));
  }
};

const getMySubmissions = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const userSubmissions = await Submission.find({
      user: req.user._id,
      content: contentId,
    });

    if (!userSubmissions) {
      return next(new ApiError("No submissions found with this id.", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Submissions fetched successfully!",
      length: userSubmissions.length,
      data: userSubmissions,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching submissions.", 400));
  }
};

const getAllSubmissions = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const allSubmissions = await Submission.find({
      content: contentId,
    });

    res.status(200).json({
      status: "success",
      message: "All submissions fetched successfully!",
      length: allSubmissions.length,
      data: allSubmissions,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching all submissions.", 400));
  }
};

const feedbackOnFinalProject = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const { status, feedback } = req.body || {};

    const finalProjectSubmission = await Submission.findOne({
      content: contentId,
      finalProjectSubmission: { $exists: true, $ne: null },
    }).populate({
      path: "content",
      populate: {
        path: "instructor",
      },
    });

    if (!finalProjectSubmission) {
      return next(
        new ApiError("No final project submission found with this id.", 404),
      );
    }

    if (
      req.user.role === "instructor" &&
      finalProjectSubmission.content.instructor._id.toString() !==
        req.user._id.toString()
    ) {
      return next(
        new ApiError(
          "You are not authorized to give feedback on this final project.",
          403,
        ),
      );
    }
    let data = {};

    if (status) data.status = status;
    if (feedback) data.feedback = feedback;

    const feedbackGiven = await Submission.findOneAndUpdate(
      {
        content: contentId,
        finalProjectSubmission: { $exists: true, $ne: null },
      },
      {
        $set: {
          "finalProjectSubmission.status": data.status,
          "finalProjectSubmission.feedback": data.feedback,
        },
      },
      { returnDocument: "after" },
    );

    res.status(201).json({
      status: "success",
      message: "Feedback on final project saved successfully!",
      data: feedbackGiven,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error giving feedback on final project", 500));
  }
};

export {
  submitQuiz,
  submitTask,
  submitFinalProject,
  getMySubmissions,
  getAllSubmissions,
  feedbackOnFinalProject,
};
