const express = require("express");
const db = require("../config/database");

const router = express.Router();

// Get saved providers for logged-in user
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await db.query(`
      SELECT
        v.id,
        v.name,
        v.service_type,
        v.rating,
        v.is_verified,
        v.is_premium,
        v.image_url,
        v.phone,
        v.whatsapp,
        v.address,
        v.city,
        v.state,
        v.postal_code,
        sp.created_at AS saved_at
      FROM saved_providers sp
      INNER JOIN vendors v
        ON v.id = sp.vendor_id
      WHERE sp.user_id = ?
        AND v.is_active = 1
      ORDER BY sp.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get saved providers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved providers.",
    });
  }
});

// Save a provider
router.post("/:vendorId", async (req, res) => {
  try {
    const userId = req.userId;
    const vendorId = Number(req.params.vendorId);

    if (!Number.isInteger(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID.",
      });
    }

    const [vendor] = await db.query(
      `SELECT id FROM vendors WHERE id = ? AND is_active = 1`,
      [vendorId]
    );

    if (vendor.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    await db.query(
      `INSERT INTO saved_providers (user_id, vendor_id)
       VALUES (?, ?)`,
      [userId, vendorId]
    );

    res.status(201).json({
      success: true,
      message: "Provider saved.",
    });
  } catch (error) {
    // Already saved
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Provider already saved.",
      });
    }

    console.error("Save provider error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save provider.",
    });
  }
});

// Remove saved provider
router.delete("/:vendorId", async (req, res) => {
  try {
    const userId = req.userId;
    const vendorId = Number(req.params.vendorId);

    if (!Number.isInteger(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID.",
      });
    }

    await db.query(
      `DELETE FROM saved_providers
       WHERE user_id = ? AND vendor_id = ?`,
      [userId, vendorId]
    );

    res.json({
      success: true,
      message: "Provider removed from saved providers.",
    });
  } catch (error) {
    console.error("Remove saved provider error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove provider.",
    });
  }
});

module.exports = router;