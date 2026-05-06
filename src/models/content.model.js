import mongoose from "mongoose";
import slugify from "slugify";

// ─────────────────────────────────────────────
// Shared options
// ─────────────────────────────────────────────
const contentOptions = {
  discriminatorKey: "contentType",
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
};

// ─────────────────────────────────────────────
// Base Content Schema
// ─────────────────────────────────────────────
const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Content title required"],
      trim: true,
    },

    slug: { type: String, trim: true, unique: true, index: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Content category required"],
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Content instructor required"],
    },

    description: {
      type: String,
      required: [true, "Content description required"],
      trim: true,
    },

    learningOutcomes: {
      type: [String],
      default: [],
    },

    prerequisites: {
      type: [String],
      default: [],
    },

    welcomeMessage: { type: String, trim: true, default: "" },

    congratulationsMessage: { type: String, trim: true, default: "" },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    language: { type: String, enum: ["ar", "en", "fr"], default: "ar" },

    materials: { type: [String], default: [] },

    price: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: { type: String, default: "SAR" },
      _id: false,
    },

    thumbnail: {
      url: { type: String, default: "" },
      key: { type: String, default: "" },
      uploadId: { type: String, default: "" },
      uploadedAt: Date,
      _id: false,
    },

    welcomeVideo: {
      url: { type: String, default: "" },
      key: { type: String, default: "" },
      uploadId: { type: String, default: "" },
      size: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
      uploadedAt: Date,
      _id: false,
    },

    finalProject: {
      title: { type: String, trim: true, default: "Final Project" },
      description: { type: String, trim: true, default: "" },
      tasks: { type: [String], default: [] },
      materials: { type: [String], default: [] },
    },

    // ✅ Denormalized metadata — updated explicitly via service layer or middleware
    metadata: {
      modulesCount: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
      totalStudentsEnrolled: { type: Number, default: 0 },
      ratingsCount: { type: Number, default: 0 },
      avgRatings: { type: Number, default: 0, min: 0, max: 5 },
    },
  },
  contentOptions,
);

// ─────────────────────────────────────────────
// Virtuals
// ─────────────────────────────────────────────
contentSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "content",
  localField: "_id",
});

// ─────────────────────────────────────────────
// Slug pre-save — handles duplicates gracefully
// ─────────────────────────────────────────────
contentSchema.pre("save", async function () {
  if (this.isModified("title") || !this.slug) {
    const slug = slugify(this.title, { lower: true, trim: true });

    const existing = await Content.findOne({
      slug,
      _id: { $ne: this._id },
    });

    this.slug = existing ? `${slug}-${Date.now()}` : slug;
  }
});

// ─────────────────────────────────────────────
// Module subdocument discriminators (Course)
// ─────────────────────────────────────────────

// Base module schema — discriminatorKey matches the existing "moduleType" field
const courseModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 }, // ✅ Explicit ordering field
  },
  { discriminatorKey: "moduleType", _id: true },
);

const videoModuleSchema = new mongoose.Schema({
  video: {
    url: { type: String, default: "", trim: true },
    key: { type: String, default: "", trim: true },
    uploadId: { type: String, default: "", trim: true },
    size: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    uploadedAt: Date,
  },
});

const quizModuleSchema = new mongoose.Schema({
  quiz: [
    {
      question: { type: String, required: true, trim: true },
      options: { type: [String], required: true },
      // ✅ answer excluded from API responses by default
      answer: { type: String, required: true, select: false, trim: true },
    },
  ],
});

const taskModuleSchema = new mongoose.Schema({
  task: {
    url: { type: String, default: "", trim: true },
    image: {
      url: { type: String, default: "", trim: true },
      key: { type: String, default: "", trim: true },
      uploadId: { type: String, default: "", trim: true },
      uploadedAt: Date,
    },
    description: { type: String, default: "", trim: true },
  },
});

const linkModuleSchema = new mongoose.Schema({
  link: {
    url: { type: String, default: "", trim: true },
    date: { type: Date, required: true },
  },
});

// ─────────────────────────────────────────────
// Course Schema
// ─────────────────────────────────────────────
const courseSchema = new mongoose.Schema(
  {
    sections: [
      {
        title: { type: String, required: true, trim: true },
        modules: [courseModuleSchema],
      },
    ],
  },
  { timestamps: true },
);

// Register module discriminators on the modules array path
const modulesArrayCourse = courseSchema.path("sections.modules");
modulesArrayCourse.discriminator("video", videoModuleSchema);
modulesArrayCourse.discriminator("quiz", quizModuleSchema);
modulesArrayCourse.discriminator("task", taskModuleSchema);
modulesArrayCourse.discriminator("link", linkModuleSchema);

// ─────────────────────────────────────────────
// Module subdocument discriminators (Bootcamp)
// ─────────────────────────────────────────────

// Base module schema — discriminatorKey matches the existing "moduleType" field
const bootcampModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 }, // ✅ Explicit ordering field
  },
  { discriminatorKey: "moduleType", _id: true },
);

const liveSessionModuleSchema = new mongoose.Schema({
  liveSession: {
    startTime: String, // "09:00"
    endTime: String, // "17:00"
    timezone: { type: String, default: "Asia/Riyadh" },
    date: { type: Date, required: true },
    meetLink: { type: String, default: "", trim: true },
    liveStreamUrl: { type: String, default: "", trim: true },
  },
});

// ─────────────────────────────────────────────
// Bootcamp Schema
// ─────────────────────────────────────────────
const bootcampSchema = new mongoose.Schema(
  {
    sections: [
      {
        title: { type: String, required: true, trim: true },
        modules: [bootcampModuleSchema],
        projects: [
          {
            title: { type: String, required: true, trim: true },
            description: { type: String, required: true, trim: true },
            githubUrl: { type: String, default: "", trim: true },
            liveDemoUrl: { type: String, default: "", trim: true },
          },
        ],
      },
    ],

    startDate: Date,
    endDate: Date,
    totalProjects: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Register module discriminators on the modules array path
const modulesArrayBootcamp = bootcampSchema.path("sections.modules");
modulesArrayBootcamp.discriminator("liveSession", liveSessionModuleSchema);
modulesArrayBootcamp.discriminator("video", videoModuleSchema);
modulesArrayBootcamp.discriminator("quiz", quizModuleSchema);
modulesArrayBootcamp.discriminator("task", taskModuleSchema);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────

// Dashboard and public listing filters
contentSchema.index({ contentType: 1 });
contentSchema.index({ category: 1 });
contentSchema.index({ instructor: 1 });

// ─────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────
const Content = mongoose.model("Content", contentSchema);
const Course = Content.discriminator("course", courseSchema);
const Bootcamp = Content.discriminator("bootcamp", bootcampSchema);

export { Content, Course, Bootcamp };
