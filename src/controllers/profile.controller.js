import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { cascadeDeleteUser } from "../utils/cascadeDelete.js";
import { sanitizedUser } from "../utils/dataSanitizer.js";
import { generateAccessToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";

// Get Logged In User Profile
const getMyProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const user = await User.findById(_id).select("-password").lean();

    res.status(200).json({
      status: "success",
      message: "تم جلب الملف الشخصي بنجاح",
      data: user,
    });
  } catch (error) {
    console.log(error);
    next(new ApiError("حدث خطأ أثناء جلب الملف الشخصي", 500));
  }
};

// Update Logged In User Profile
const updateMyProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const {
      name,
      bio,
      languages,
      skills,
      links,
      experience,
      education,
      instructorDetails,
      studentDetails,
    } = req.body;

    const user = await User.findById(_id);
    if (!user) return next(new ApiError("User not found", 404));

    const updates = Object.fromEntries(
      Object.entries({
        name,
        bio,
        languages,
        skills,
        links,
        experience,
        education,
        instructorDetails:
          user.role === "instructor"
            ? { ...(user.instructorDetails || {}), ...instructorDetails }
            : user.instructorDetails || undefined,
        studentDetails:
          user.role === "student"
            ? { ...(user.studentDetails || {}), ...studentDetails }
            : user.studentDetails || undefined,
      }).filter(([, v]) => v !== undefined),
    );

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $set: updates },
      { returnDocument: "after", select: "-password" },
    ).lean();

    res.status(200).json({
      status: "success",
      message: "تم تحديث الملف الشخصي بنجاح",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء تحديث الملف الشخصي", 500));
  }
};

// Delete Logged In User Profile
const deleteMyProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;

    // Delete user and all related data
    await cascadeDeleteUser(_id);
    await User.findByIdAndDelete(_id);

    return res.status(204).end();
  } catch (error) {
    console.error(error);
    next(new ApiError("حدث خطأ أثناء حذف الملف الشخصي", 500));
  }
};

// // Get Logged In User Profile Image
const getMyProfileImage = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const user = await User.findById(_id).select("profileImage avatar").lean();

    if (!user.profileImage && !user.avatar) {
      return res.status(404).json({
        status: "error",
        message: "لا يوجد صورة شخصية للمستخدم",
      });
    }

    res.status(200).json({
      status: "success",
      message: "تم جلب صورة الملف الشخصي بنجاح",
      data: user.profileImage || user.avatar,
    });
  } catch (error) {
    console.error("Error fetching profile image:", error.message);
    return next(new ApiError("حدث خطأ اثناء جلب صورة الملف الشخصي", 500));
  }
};

// // Upload Logged In User Profile Image
// const uploadMyProfileImage = async (req, res, next) => {
//   try {
//     const { file } = req;
//     if (!file) return next(new ApiError("لا توجد صورة", 400));

//     const user = await User.findById(req.user._id).select("profileImage");

//     // Delete old image from Cloudinary if exists
//     if (user.profileImage?.public_id) {
//       await removeImageFromCloudinary(user.profileImage.public_id);
//     }

//     // Compress image
//     const compressedBuffer = await sharp(file.buffer)
//       .resize({ width: 1080 })
//       .jpeg({ quality: 70 })
//       .toBuffer();

//     // Upload new image to Cloudinary
//     const result = await uploadImageToCloudinary(compressedBuffer, {
//       public_id: `profile_${req.file.originalname}`,
//       folder: `profile-images/${req.user._id}`,
//     });

//     const imageData = {
//       public_id: result.public_id,
//       url: result.secure_url,
//       uploadedAt: new Date(),
//     };

//     // Update user profile image
//     user.profileImage = imageData;
//     await user.save();

//     res.status(200).json({
//       status: "success",
//       message: "تم رفع الصورة بنجاح",
//       data: imageData,
//     });
//   } catch (error) {
//     console.error("Error uploading profile image:", error.message);
//     return next(new ApiError("حدث خطأ اثناء رفع صورة الملف الشخصي", 500));
//   }
// };

// Delete Logged In User Profile Image
const deleteMyProfileImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError("User not found", 404));
    }

    if (!user.profileImage) {
      return next(new ApiError("لا توجد صورة لحذفها", 404));
    }

    // Delete image from cloud

    // Update user profile image
    await User.findByIdAndUpdate(user._id, {
      profileImage: null,
    });

    res.status(200).json({
      status: "success",
      message: "تم حذف الصورة بنجاح",
    });
  } catch (error) {
    console.error("Error deleting profile image:", error.message);
    return next(new ApiError("حدث خطأ اثناء حذف صورة الملف الشخصي", 500));
  }
};

// Change Logged In User Password
const changePassword = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const user = await User.findById(_id);

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // check if current password is correct
    if (!user.password) {
      return next(
        new ApiError(
          "عذراً، حسابك مسجل عبر جوجل ولا يحتوي على كلمة مرور. لا يمكنك تغيير كلمة المرور هنا.",
          400,
        ),
      );
    }

    if (!(await user.comparePassword(currentPassword))) {
      console.warn(`Failed password change attempt for user: ${user.email}`);
      return next(new ApiError("الباسوورد الحالي غير صحيح", 400));
    }

    // update the new password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // generate the jwt
    const accessToken = generateAccessToken(user._id);

    // send email notification
    try {
      await sendEmail({
        email: user.email,
        subject: `تم تغيير الباسوورد بنجاح`,
        message: `Hi ${
          user.name
        },\n\nتم تغيير الباسوورد بنجاح.\n\nاذا لم تكن انت من قام بغيير الباسوورد, من فضلك اتصل بفريق الدعم.\n\nمع خالص التحية,\nفريق هاش بلس`,
      });
      console.log("Email Notification was Sent Successfully");
    } catch (error) {
      console.error("Error sending password change email:", error);
    }

    res.status(200).json({
      status: "success",
      message: "تم تغيير الباسوورد بنجاح",
      data: sanitizedUser(user),
      token: accessToken,
    });
  } catch (error) {
    console.error("Error changing password:", error);
    next(new ApiError("حدث خطأ أثناء تغيير الباسوورد", 500));
  }
};

export {
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
  changePassword,
  getMyProfileImage,
  // uploadMyProfileImage,
  deleteMyProfileImage,
};
