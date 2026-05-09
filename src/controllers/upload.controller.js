import { ApiError } from "../utils/apiError.js";
import {
  startMultipartUpload,
  getMultipartPresignedUrls,
  completeMultipartUpload,
  abortMultipartUpload,
  deleteUpload,
  getStreamPresignedUrl,
  uploadPublicFileToR2,
  getDownloadUrl,
} from "../services/r2.service.js";
import { R2_ENDPOINT } from "../config/env.js";

// Start Multipart Upload, Generate Pre-Signed URLs
export const startUpload = async (req, res, next) => {
  try {
    const { fileName, fileType, userId, partsCount } = req.body;

    const { key } = await startMultipartUpload(fileName, fileType, userId);

    if (!key) {
      return next(
        new ApiError("Error starting multipart upload. key is missing.", 400),
      );
    }

    const urls = await getMultipartPresignedUrls(key, partsCount);

    res.status(200).json({
      status: "success",
      message: "Pre-Signed URLs Generated Successfuly!",
      data: {
        key,
        urls,
      },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error uploading content.", 400));
  }
};

// Complete Multipart Upload
export const completeUpload = async (req, res, next) => {
  try {
    const { key, parts } = req.body;

    const data = await completeMultipartUpload(key, parts);

    res.status(200).json({
      status: "success",
      message: "Upload Completed Successfuly!",
      data,
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error uploading content.", 400));
  }
};

// Abort Multipart Uploads
export const abortUpload = async (req, res, next) => {
  try {
    const { key } = req.body;

    const data = await abortMultipartUpload(key);

    if (!data) {
      return next(new ApiError("Error aborting upload.", 400));
    }

    res.status(200).json({
      status: "success",
      message: "Upload Aborted Successfuly!",
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error aborting upload.", 500));
  }
};

// Delete Upload
export const removeUpload = async (req, res, next) => {
  try {
    const { key } = req.body;

    const data = await deleteUpload(key);

    if (!data) {
      return next(new ApiError("Error deleting upload.", 400));
    }

    res.status(200).json({
      status: "success",
      message: "Upload Removed Successfuly!",
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error removing upload.", 400));
  }
};

// Generate a streaming presigned URL for a private R2 object
export const getStreamUrl = async (req, res, next) => {
  try {
    const { key, expiresIn } = req.body;

    const url = await getStreamPresignedUrl(key, expiresIn);

    res.status(200).json({
      status: "success",
      message: "Stream URL generated successfully!",
      data: {
        url,
        expiresIn: expiresIn ?? 3600, // seconds until expiry
      },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error generating stream URL.", 500));
  }
};

// ────── Assets (thumbnails, avatars, certificates, pdf documents, etc) ─────
export const uploadAsset = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    const data = await uploadPublicFileToR2(file, userId);

    const publicUrl = `https://pub-61bedfe304674c29b2a178b480d101cf.r2.dev/${data.key}`;

    res.status(200).json({
      status: "success",
      message: "Asset uploaded successfully!",
      data: {
        url: publicUrl,
        ...data,
      },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error uploading asset.", 500));
  }
};

export const getAssetDownloadUrl = async (req, res, next) => {
  try {
    const { key } = req.body;
    const url = await getDownloadUrl(key);
    res.status(200).json({
      status: "success",
      message: "Download URL generated successfully!",
      data: {
        url,
      },
    });
  } catch (error) {
    console.error(error);
    next(new ApiError("Error generating download URL.", 500));
  }
};
