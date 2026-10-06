const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
} = require("../controllers/searchHistory.controller");

const router = express.Router();

router.get("/", verifyToken, getSearchHistory);
router.post("/", verifyToken, addSearchHistory);
router.delete("/", verifyToken, deleteSearchHistory);

module.exports = router;