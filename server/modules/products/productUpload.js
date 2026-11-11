//for the photo insertion

import multer from "multer";

import fs from "node:fs";

import { randomUUID } from "node:crypto";

import { fileURLToPath } from "node:url";

const uploadsFolder = fileURLToPath(new URL("../../uploads/", import.meta.url));

// Create the folder if it doesn't exist

fs.mkdirSync(uploadsFolder, { recursive: true });

// Image types we'll accept

const imageTypes = {
  "image/jpeg": ".jpg",

  "image/png": ".png",

  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: uploadsFolder,

  filename: (req, file, cb) => {
    const extension = imageTypes[file.mimetype];

    cb(null, randomUUID() + extension);
  },
});

const upload = multer({
  storage: storage,

  limits: {
    files: 4,

    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (imageTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP images are allowed"));
    }
  },
});

// Delete uploaded files if saving the product fails

function deleteUploadedFiles(files) {
  for (const file of files || []) {
    fs.unlink(file.path, () => {});
  }
}

export { uploadsFolder, upload, deleteUploadedFiles };
