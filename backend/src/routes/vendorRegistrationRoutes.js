const express = require("express");
const authenticateUser = require("../middleware/authMiddleware.js");
const vendorImageUpload = require("../middleware/vendorImageMemoryUpload.js");
const {
  registerVendor,
  getMyVendorRegistration,
} = require("../controllers/vendorRegistrationController.js");

const router = express.Router();

router.get("/me", authenticateUser, getMyVendorRegistration);

router.post(
  "/",
  authenticateUser,
  vendorImageUpload.single("logo"),
  registerVendor
);

module.exports = router;
