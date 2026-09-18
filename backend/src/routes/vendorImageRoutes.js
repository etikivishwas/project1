const express = require("express");
const {
  streamVendorImage,
  streamGalleryImage,
} = require("../controllers/vendorImageController.js");

const router = express.Router();

router.get("/vendors/:vendorId/main", streamVendorImage);
router.get("/gallery/:imageId", streamGalleryImage);

module.exports = router;
