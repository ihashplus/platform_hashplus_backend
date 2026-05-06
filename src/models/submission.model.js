import mongoose from "mongoose";

const QuizSubmissionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  moduleId: { type: String, required: true },

  data: [
    {
      question: { type: String, required: true, trim: true },
      answer: { type: String, required: true, trim: true },
    },
  ],

  score: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    enum: ["pending", "pass", "fail"],
    default: "pending",
  },
});

const TaskSubmissionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  moduleId: { type: String, required: true },

  url: { type: String, default: "", trim: true },
  imageUrl: { type: String, default: "", trim: true },
  description: { type: String, default: "", trim: true },
  uploadedAt: Date,
});

const FinalProjectSubmissionSchema = new mongoose.Schema({
  links: { type: [String], default: [] },
  notes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  feedback: {
    type: String,
    default: "",
  },
});

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },

    quizSubmissions: [QuizSubmissionSchema],
    taskSubmissions: [TaskSubmissionSchema],
    finalProjectSubmission: FinalProjectSubmissionSchema,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Prevent duplicate answers + fast lookup
submissionSchema.index({ user: 1, content: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);

export { Submission };
