const express = require("express");

const {
  loginVendor,
} = require(
  "../controllers/vendorPanelAuthController.js"
);

const router = express.Router();

router.post("/login", loginVendor);

module.exports = router;