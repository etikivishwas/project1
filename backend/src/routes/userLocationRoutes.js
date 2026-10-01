const express = require("express");

const userLocationController =
  require("../controllers/userLocationController");

const requireUser =
  require("../middleware/requireUser");

const router = express.Router();

router.use(requireUser);

router.get(
  "/location",
  userLocationController.getUserLocation
);

router.post(
  "/location",
  userLocationController.saveUserLocation
);

module.exports = router;