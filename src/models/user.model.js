import mongoose from "mongoose";
import bcrypt from "bcrypt";

const instructorDetailsSchema = new mongoose.Schema(
  {
    teachingStyle: { type: String, trim: true, default: "" },
    videoProfessionality: { type: String, trim: true, default: "" },
    targetAudience: { type: String, trim: true, default: "" },

    rating: { type: Number, min: 0, max: 5 },
    createdContent: [{ type: mongoose.Schema.Types.ObjectId, ref: "Content" }],

    totalRating: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    totalCreatedContent: { type: Number, default: 0 },

    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
  },
  { _id: false, timestamps: true },
);

const studentDetailsSchema = new mongoose.Schema(
  {
    projects: {
      type: [
        {
          title: String,
          description: String,
          roleInProject: String,
          skillsUsed: { type: [String], default: [] },
          startDate: Date,
          endDate: Date,
          projectImageUrls: [String],
        },
      ],
      default: [],
    },

    certificates: [
      {
        name: String,
        description: String,
        contentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content" },
        certificateUrl: String,
        issuedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false, timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "User email required"],
      unique: [true, "User email already exists"],
      trim: true,
    },
    password: { type: String },
    authProvider: { type: String, default: "local" },
    googleId: { type: String },
    avatar: { type: String },
    profileImage: {
      url: { type: String, default: "" },
      key: { type: String, default: "" },
      uploadedAt: Date,
      _id: false,
    },

    bio: { type: String, trim: true },

    languages: {
      type: [{ language: String, proficiency: String, _id: false }],
      default: [],
    },

    skills: { type: [String], default: [] },

    links: {
      type: [{ name: String, url: String, _id: false }],
      default: [],
    },

    experience: {
      type: [
        {
          company: String,
          country: String,
          city: String,
          jobTitle: String,
          jobType: String,
          jobStyle: String,
          startDate: Date,
          endDate: Date,
          skills: { type: [String], default: [] },
          description: String,
          isCurrent: { type: Boolean, default: false },
          _id: false,
        },
      ],
      default: [],
    },

    education: {
      type: [
        {
          institution: String,
          degree: String,
          major: String,
          startDate: Date,
          endDate: Date,
          description: String,
          isCurrent: { type: Boolean, default: false },
          _id: false,
        },
      ],
      default: [],
    },

    instructorDetails: { type: instructorDetailsSchema, default: () => ({}) },
    studentDetails: { type: studentDetailsSchema, default: () => ({}) },

    role: {
      type: String,
      enum: ["student", "admin", "instructor"],
      default: "student",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,

    otpCode: String,
    otpEat: Date,
    otpIsVerified: { type: Boolean, default: false },

    passResetCode: String,
    passResetCodeEat: Date,
    passResetCodeVerified: Boolean,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// pre-save hook to hash password before saving in db
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    if (!this.password) return;
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error) {
    throw error;
  }
});

// mongoose method to compare passwords
userSchema.methods = {
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  },
};

const User = mongoose.model("User", userSchema);

export default User;
