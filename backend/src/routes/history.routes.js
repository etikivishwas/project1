const express = require("express");

const {
  getUserHistory,
} = require("../controllers/history.controller");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// SERVICE HISTORY
// =====================================================

// All history for logged-in user
router.get(
  "/",
  authMiddleware,
  getUserHistory
);


module.exports = router;