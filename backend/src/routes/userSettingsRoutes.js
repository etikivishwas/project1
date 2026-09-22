const express = require("express");

const rateLimit = require(
  "express-rate-limit"
);

const userSettingsController =
  require(
    "../controllers/userSettingsController"
  );

const twoFactorController =
  require(
    "../controllers/twoFactorController"
  );

const requireUser =
  require(
    "../middleware/requireUser"
  );

const router = express.Router();

const sensitiveLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many requests. Please try again after 15 minutes.",
    },
  });

router.use(requireUser);

router.get(
  "/settings",
  userSettingsController
    .getSettings
);

router.patch(
  "/settings",
  userSettingsController
    .updateSettings
);

router.post(
  "/password",
  sensitiveLimiter,
  userSettingsController
    .changePassword
);

router.post(
  "/two-factor/setup",
  sensitiveLimiter,
  twoFactorController
    .beginTwoFactorSetup
);

router.post(
  "/two-factor/confirm",
  sensitiveLimiter,
  twoFactorController
    .confirmTwoFactorSetup
);

router.delete(
  "/two-factor",
  sensitiveLimiter,
  twoFactorController
    .disableTwoFactor
);

router.delete(
  "/account",
  sensitiveLimiter,
  userSettingsController
    .deleteAccount
);

module.exports = router;