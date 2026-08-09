const db = require("../config/database.js");

const getVendors = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        name,
        service_type,
        description,
        rating,
        is_verified,
        is_premium,
        image_url,
        phone,
        whatsapp,
        address,
        city,
        latitude,
        longitude,
        is_active,
        created_at,
        updated_at
      FROM vendors
      WHERE is_active = TRUE
      ORDER BY is_premium DESC, rating DESC
    `);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error("Error fetching vendors:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
};

module.exports = {
  getVendors,
};