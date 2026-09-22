const express = require("express");
const rateLimit = require("express-rate-limit");
const requireUser = require("../middleware/requireUser");
const vendorReviewController = require("../controllers/vendorReviewController");

const router = express.Router({ mergeParams: true });

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many feedback requests. Please try again later.",
  },
});

router.use(requireUser);

router.post(
  "/:vendorId/experience-feedback",
  reviewLimiter,
  vendorReviewController.submitVendorReview
);

module.exports = router;
