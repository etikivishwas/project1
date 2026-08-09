const express = require("express");

const {
  getVendors,
} = require("../controllers/vendorController.js");

const router = express.Router();

router.get("/", getVendors);

module.exports = router;