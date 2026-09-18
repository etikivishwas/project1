const express = require("express");
const { getVendorById, createVendorBooking } = require("../controllers/vendorPublicController.js");
const authenticateUser = require("../middleware/authMiddleware.js");
const router = express.Router();
router.get("/:vendorId", getVendorById);
router.post("/:vendorId/bookings", authenticateUser, createVendorBooking);
module.exports = router;
