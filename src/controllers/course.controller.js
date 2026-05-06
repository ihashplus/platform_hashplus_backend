import { ApiError } from "../utils/apiError.js";
import { Course } from "../models/content.model.js";

// --------------------- Sections ---------------------
const getOneCourseSection = async (req, res, next) => {
  try {
    const { contentId, sectionId } = req.params;

    const course = await Course.findById(contentId);

    if (!course) {
      return next(new ApiError("No course found with this id.", 404));
    }

    const section = course.sections.id(sectionId);

    if (!section) {
      return next(new ApiError("No section found with this id.", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Section Fetched Successfuly!",
      data: section,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching section.", 400));
  }
};

const getAllCourseSections = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const course = await Course.findById(contentId);
    if (!course) {
      return next(new ApiError("No course found with this id.", 404));
    }
    res.status(200).json({
      status: "success",
      message: "Sections Fetched Successfuly!",
      length: course.sections.length,
      data: course.sections.map((section) => ({
        _id: section._id,
        title: section.title,
        modulesCount: section.modules.length,
      })),
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching sections.", 400));
  }
};

const addCourseSection = async (req, res, next) => {
  try {
    const { title } = req.body || {};
    const { contentId } = req.params;

    const course = await Course.findById(contentId);

    if (!course) {
      return next(new ApiError("No course found with this id.", 404));
    }

    const section = {
      title,
      modules: [],
    };

    const updatedCourse = await Course.findByIdAndUpdate(
      contentId,
      { $addToSet: { sections: { $each: [section] } } },
      { returnDocument: "after" },
    );

    const sectionId =
      updatedCourse.sections[updatedCourse.sections.length - 1]._id || null;

    res.status(201).json({
      status: "success",
      message: "Section Added Successfully!",
      data: {
        _id: sectionId,
        ...section,
      },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching section.", 400));
  }
};

const updateOneCourseSection = async (req, res, next) => {
  try {
    const { title } = req.body || {};
    const { contentId, sectionId } = req.params;

    const course = await Course.findById(contentId);

    if (!course) {
      return next(new ApiError("No course found with this id.", 404));
    }

    const section = course.sections.id(sectionId);

    if (!section) {
      return next(new ApiError("No section found with this id.", 404));
    }

    if (title) section.title = title;

    await course.save();

    res.status(200).json({
      status: "success",
      message: "Section Updated Successfully!",
      data: section,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error updating section.", 400));
  }
};

const removeOneCourseSection = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { sectionId } = req.params;

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: contentId },
      { $pull: { sections: { _id: sectionId } } },
      { returnDocument: "after" },
    );

    if (!updatedCourse) {
      return next(new ApiError("No course found with this id.", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Section Removed Successfully!",
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching section.", 400));
  }
};

// --------------------- Modules ---------------------
const getAllCourseModules = async (req, res, next) => {
  try {
    const { sectionId, contentId } = req.params;

    const content = await Course.findById(contentId);
    if (!content) {
      return next(new ApiError("No course found with this id.", 404));
    }
    const section = content.sections.id(sectionId);
    if (!section) {
      return next(new ApiError("No section found with this id.", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Modules Fetched Successfuly!",
      length: section.modules.length,
      data: section.modules.map((module) => ({
        _id: module._id,
        moduleType: module.moduleType,
        title: module.title,
      })),
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching modules.", 400));
  }
};

const getOneCourseModule = async (req, res, next) => {
  try {
    const { contentId, sectionId, moduleId } = req.params;

    const content = await Course.findById(contentId);

    if (!content) {
      return next(new ApiError("No content found with this id.", 404));
    }

    const section = content.sections.id(sectionId);

    if (!section) {
      return next(new ApiError("No section found with this id.", 404));
    }

    const module = section.modules.id(moduleId);

    if (!module) return next(new ApiError("No module Found", 404));

    res.status(200).json({
      status: "success",
      message: "Module Fetched Successfuly!",
      data: module,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error fetching module.", 400));
  }
};

const addCourseModule = async (req, res, next) => {
  try {
    const {
      moduleType,
      title,
      description,
      videoData,
      quizData,
      taskData,
      linkData,
    } = req.body || {};

    const { contentId, sectionId } = req.params;

    const content = await Course.findById(contentId);

    if (!content) {
      return next(new ApiError(`No content found with id: ${contentId}`, 404));
    }

    const section = content.sections.id(sectionId);

    if (!section) {
      return next(new ApiError("No section found with this id.", 404));
    }

    let dataObj = {};

    switch (moduleType) {
      case "video":
        dataObj = { video: { ...videoData, uploadedAt: new Date() } };
        break;
      case "quiz":
        dataObj = { quiz: [...quizData] };
        break;
      case "task":
        dataObj = {
          task: {
            ...taskData,
            image: { ...taskData.image, uploadedAt: new Date() },
          },
        };
        break;
      case "link":
        dataObj = { link: { ...linkData } };
        break;
      default:
        return next(new ApiError(`Unknown moduleType: ${moduleType}`, 400));
    }

    section.modules.push({
      title,
      description,
      moduleType,
      order: (section.modules.length ?? 0) + 1,
      ...dataObj,
    });

    await content.save();

    const savedModule = section.modules[section.modules.length - 1];

    res.status(201).json({
      status: "success",
      message: "Module Added Successfully!",
      data: savedModule,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error adding module.", 400));
  }
};

const updateOneCourseModule = async (req, res, next) => {
  try {
    const { contentId, sectionId, moduleId } = req.params;

    const {
      moduleType,
      title,
      description,
      videoData,
      quizData,
      taskData,
      linkData,
    } = req.body || {};

    const content = await Course.findById(contentId);

    if (!content) {
      return next(new ApiError("No course found with this id.", 404));
    }

    const section = content.sections.id(sectionId);
    if (!section)
      return next(new ApiError("No section found with this id.", 404));

    const module = section.modules.id(moduleId);
    if (!module)
      return next(new ApiError("No module found with this id.", 404));

    if (title) module.title = title;
    if (description) module.description = description;

    if (moduleType === "video") {
      module.video = { ...videoData, uploadedAt: new Date() };
    } else if (moduleType === "quiz") {
      module.quiz = [...quizData];
    } else if (moduleType === "task") {
      module.task = {
        ...taskData,
        image: { ...taskData.image, uploadedAt: new Date() },
      };
    } else if (moduleType === "link") {
      module.link = { ...linkData };
    }

    await content.save();

    res.status(200).json({
      status: "success",
      message: "Module Updated Successfully!",
      data: module,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error updating module.", 400));
  }
};

const removeOneCourseModule = async (req, res, next) => {
  try {
    const { contentId, sectionId, moduleId } = req.params;

    const content = await Course.findById(contentId);

    if (!content) {
      return next(new ApiError("No course found with this id.", 404));
    }

    const section = content.sections.id(sectionId);
    if (!section)
      return next(new ApiError("No section found with this id.", 404));

    const module = section.modules.id(moduleId);

    if (!module) {
      return next(new ApiError("No module found with this id.", 404));
    }

    // TODO: If video moduleType, delete from R2 storage here

    section.modules.pull(moduleId);

    // Re-order remaining modules after removal
    section.modules.forEach((mod, idx) => (mod.order = idx + 1));

    await content.save();

    res.status(200).json({
      status: "success",
      message: "Module Removed Successfully!",
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error removing module.", 400));
  }
};

export {
  // Sections
  getAllCourseSections,
  getOneCourseSection,
  addCourseSection,
  updateOneCourseSection,
  removeOneCourseSection,

  // Modules
  getAllCourseModules,
  getOneCourseModule,
  addCourseModule,
  updateOneCourseModule,
  removeOneCourseModule,
};
