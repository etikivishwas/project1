const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDirectory = process.env.VENDOR_LOGO_UPLOAD_DIR
  ? path.resolve(process.env.VENDOR_LOGO_UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads", "vendor-logos");

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadDirectory);
  },
  filename(req, file, callback) {
    const extension = extensionByMimeType[file.mimetype] || ".bin";
    const randomPart = crypto.randomBytes(8).toString("hex");
    callback(null, `vendor-${Date.now()}-${randomPart}${extension}`);
  },
});

const vendorLogoUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only JPG, PNG, and WEBP images are allowed.");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

module.exports = vendorLogoUpload;
