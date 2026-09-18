const multer = require("multer");

const uploadErrorHandler = (
  error,
  req,
  res,
  next
) => {
  if (!error) {
    return next();
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message:
          "The logo must be smaller than 5 MB.",
        errors: {
          logo:
            "The selected logo exceeds the 5 MB limit.",
        },
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message:
          "Only one logo can be uploaded.",
        errors: {
          logo:
            "Select only one logo file.",
        },
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          "The uploaded file field is invalid.",
        errors: {
          logo:
            "The expected upload field is named logo.",
        },
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "The logo could not be uploaded.",
      errors: {
        logo:
          error.message ||
          "Logo upload failed.",
      },
    });
  }

  if (
    error.message ===
    "Only JPG, JPEG, and PNG files are allowed."
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: {
        logo: error.message,
      },
    });
  }

  return next(error);
};

module.exports = uploadErrorHandler;