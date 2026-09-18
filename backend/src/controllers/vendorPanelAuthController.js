const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../config/database.js");

const loginVendor = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const [rows] = await db.query(
      `
        SELECT
          vpa.id AS account_id,
          vpa.existing_vendor_id AS vendor_id,
          vpa.business_name,
          vpa.contact_name,
          vpa.email,
          vpa.password_hash,
          vpa.status,
          vpa.email_verified,
          v.registration_status,
          v.is_active
        FROM vendor_panel_accounts vpa
        INNER JOIN vendors v
          ON v.id = vpa.existing_vendor_id
        WHERE vpa.email = ?
        LIMIT 1
      `,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const account = rows[0];

    if (account.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          "This vendor-panel account is not active.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        account.password_hash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const accessToken = jwt.sign(
      {
        accountId: account.account_id,
        vendorId: account.vendor_id,
        role: "vendor",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    await db.query(
      `
        UPDATE vendor_panel_accounts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [account.account_id]
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken,
        vendor: {
          id: account.vendor_id,
          businessName:
            account.business_name,
          contactName:
            account.contact_name,
          email: account.email,
          registrationStatus:
            account.registration_status,
          isActive:
            Boolean(account.is_active),
        },
      },
    });
  } catch (error) {
    console.error(
      "Vendor-panel login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Vendor login could not be completed.",
    });
  }
};

module.exports = {
  loginVendor,
};