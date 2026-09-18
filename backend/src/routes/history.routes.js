const express = require("express");
const {
  getUserHistory,
} = require("../controllers/history.controller");

const router = express.Router();

// No token middleware is used for this route.
// The frontend sends the current user ID as a query parameter.
router.get("/", getUserHistory);

module.exports = router;
