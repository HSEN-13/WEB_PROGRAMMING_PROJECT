import multer from "multer";

export default function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: "Upload failed. Maximum 4 images, 20 MB total.",
    });
  }

  if (err.message === "Only JPG, PNG and WebP images are allowed") {
    return res.status(400).json({
      message: err.message,
    });
  }

  next(err);
}
