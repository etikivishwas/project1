const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const pool = require("../config/database");
const { createAndSendOtp } = require("./otpController");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// =====================================================
// VALIDATION HELPERS
// =====================================================

const isEmail = (str) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

const isMobile = (str) =>
  /^\+?[0-9]{7,15}$/.test(str);

const SALT_ROUNDS = 10;

// =====================================================
// JWT
// =====================================================

function signAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "1h",
    }
  );
}

// =====================================================
// POST /api/auth/signup
// =====================================================

exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
    } = req.body;

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message:
          "Name, email, mobile number and password are required.",
      });
    }

    // -------------------------------------------------
    // NAME VALIDATION
    // -------------------------------------------------

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        message:
          "Name must be at least 2 characters.",
      });
    }

    // -------------------------------------------------
    // EMAIL VALIDATION
    // -------------------------------------------------

    const trimmedEmail = email
      .trim()
      .toLowerCase();

    if (!isEmail(trimmedEmail)) {
      return res.status(400).json({
        message:
          "Enter a valid email address.",
      });
    }

    // -------------------------------------------------
    // MOBILE VALIDATION
    // -------------------------------------------------

    const trimmedMobile = mobile.trim();

    if (!isMobile(trimmedMobile)) {
      return res.status(400).json({
        message:
          "Enter a valid mobile number.",
      });
    }

    // -------------------------------------------------
    // PASSWORD VALIDATION
    // -------------------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters.",
      });
    }

    // -------------------------------------------------
    // CHECK EXISTING EMAIL
    // -------------------------------------------------

    const [existingEmail] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [trimmedEmail]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });
    }

    // -------------------------------------------------
    // CHECK EXISTING MOBILE
    // -------------------------------------------------

    const [existingMobile] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE mobile = ?
      LIMIT 1
      `,
      [trimmedMobile]
    );

    if (existingMobile.length > 0) {
      return res.status(409).json({
        message:
          "An account with this mobile number already exists.",
      });
    }

    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    const password_hash = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------

    await pool.query(
      `
      INSERT INTO users
      (
        name,
        email,
        mobile,
        password_hash,
        is_verified
      )
      VALUES (?, ?, ?, ?, FALSE)
      `,
      [
        trimmedName,
        trimmedEmail,
        trimmedMobile,
        password_hash,
      ]
    );

    // -------------------------------------------------
    // SEND EMAIL OTP
    // -------------------------------------------------

    await createAndSendOtp(
      trimmedEmail,
      "signup_verification"
    );

    return res.status(201).json({
      message:
        "Account created. Check your email for a verification code.",
      email: trimmedEmail,
    });

  } catch (err) {
    console.error("Signup error:", err);

    return res.status(500).json({
      message:
        "Server error during signup.",
    });
  }
};

// =====================================================
// POST /api/auth/login
// =====================================================

exports.login = async (req, res) => {
  try {
    const {
      identifier,
      password,
      rememberMe,
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message:
          "Identifier and password are required.",
      });
    }

    // -------------------------------------------------
    // DETERMINE EMAIL OR MOBILE
    // -------------------------------------------------

    const field = isEmail(identifier)
      ? "email"
      : "mobile";

    const [rows] = await pool.query(
      `
      SELECT *
      FROM users
      WHERE ${field} = ?
      LIMIT 1
      `,
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message:
          "Invalid credentials.",
      });
    }

    const user = rows[0];

    // -------------------------------------------------
    // CHECK PASSWORD
    // -------------------------------------------------

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return res.status(401).json({
        message:
          "Invalid credentials.",
      });
    }

    // -------------------------------------------------
    // CHECK EMAIL VERIFICATION
    // -------------------------------------------------

    if (!user.is_verified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in.",
        unverified: true,
        email: user.email,
      });
    }

    // -------------------------------------------------
    // REMEMBER ME
    // -------------------------------------------------

    if (rememberMe !== undefined) {
      await pool.query(
        `
        UPDATE users
        SET remember_me = ?
        WHERE id = ?
        `,
        [
          !!rememberMe,
          user.id,
        ]
      );
    }

    // -------------------------------------------------
    // TOKEN EXPIRATION
    // -------------------------------------------------

    const expiresIn = rememberMe
      ? (
          process.env.JWT_REFRESH_EXPIRES_IN ||
          "7d"
        )
      : (
          process.env.JWT_EXPIRES_IN ||
          "1h"
        );

    // -------------------------------------------------
    // CREATE TOKEN
    // -------------------------------------------------

    const token = signAccessToken({
      id: user.id,
    });

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      message:
        "Login successful.",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });

  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      message:
        "Server error during login.",
    });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user: rows[0],
    });

  } catch (err) {
    console.error("Me error:", err);

    return res.status(500).json({
      message: "Server error.",
    });
  }
};

// =====================================================
// POST /api/auth/google
// =====================================================

exports.googleLogin = async (req, res) => {
  try {

    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message:
          "Missing Google credential.",
      });
    }

    // -------------------------------------------------
    // VERIFY GOOGLE TOKEN
    // -------------------------------------------------

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    const payload =
      ticket.getPayload();

    const {
      sub: googleId,
      email,
      email_verified,
      name,
    } = payload;

    if (!email_verified) {
      return res.status(400).json({
        message:
          "Google account email is not verified.",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT *
      FROM users
      WHERE google_id = ?
         OR email = ?
      LIMIT 1
      `,
      [
        googleId,
        email,
      ]
    );

    let user;

    if (rows.length === 0) {

      const [result] = await pool.query(
        `
        INSERT INTO users
        (
          name,
          email,
          google_id,
          is_verified
        )
        VALUES (?, ?, ?, TRUE)
        `,
        [
          name || null,
          email,
          googleId,
        ]
      );

      user = {
        id: result.insertId,
        name: name || null,
        email,
        mobile: null,
      };

    } else {

      user = rows[0];

      // -------------------------------------------------
      // LINK GOOGLE ACCOUNT
      // -------------------------------------------------

      if (!user.google_id) {

        await pool.query(
          `
          UPDATE users
          SET
            google_id = ?,
            is_verified = TRUE
          WHERE id = ?
          `,
          [
            googleId,
            user.id,
          ]
        );
      }

      // If existing user doesn't have a name,
      // use the Google name.
      if (!user.name && name) {

        await pool.query(
          `
          UPDATE users
          SET name = ?
          WHERE id = ?
          `,
          [
            name,
            user.id,
          ]
        );

        user.name = name;
      }
    }

    // -------------------------------------------------
    // CREATE TOKEN
    // -------------------------------------------------

    const token = signAccessToken({
      id: user.id,
    });

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      message:
        "Google login successful.",

      token,

      user: {
        id: user.id,
        name: user.name || null,
        email: user.email,
        mobile: user.mobile || null,
      },
    });

  } catch (err) {
    console.error(
      "Google login error:",
      err
    );

    return res.status(500).json({
      message:
        "Google sign-in failed.",
    });
  }
};