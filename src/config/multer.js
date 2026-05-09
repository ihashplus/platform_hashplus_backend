import multer from "multer";
import { ApiError } from "../utils/apiError.js";

// PDF, Image files only
const fileUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(jpg|jpeg|png|pdf|docx|doc|pptx|ppt)$/i)) {
      return cb(null, true);
    } else {
      return cb(new ApiError("ملف غير مدعوم", 422), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
}).single("file");

export { fileUpload };
