import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User required"],
    },

    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: [true, "Content required"],
    },

    type: {
      type: String,
      enum: ["course", "bootcamp"],
      required: [true, "Type required"],
    },

    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// mongoose query middleware for populating the `user` field
// enrollmentSchema.pre(/^find/, function () {
//   try {
//     this.populate([
//       {
//         path: "user",
//         select: "name email isSubscribed",
//       },
//       {
//         path: "content",
//         select: "title",
//       },
//     ]);
//   } catch (error) {
//     throw error;
//   }
// });

// Compound unique — a user can only enroll once per content
enrollmentSchema.index({ user: 1, content: 1 }, { unique: true });
// Cron and dashboard queries filter by status
enrollmentSchema.index({ status: 1 });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
