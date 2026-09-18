const express = require("express");

const {
  getActiveVendorCategories,
} = require(
  "../controllers/vendorCategoryController.js"
);

const router = express.Router();

router.get(
  "/",
  getActiveVendorCategories
);

module.exports = router;