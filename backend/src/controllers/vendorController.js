const db = require("../config/database.js");

const getVendors = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
  id,
  name,
  service_type,
  rating,
  is_verified,
  is_premium,
  image_url,
  phone,
  whatsapp,
  address,
  city,
  state,
  postal_code,
  latitude,
  longitude,
  is_active,
  created_at,
  updated_at,

  (
    SELECT GROUP_CONCAT(DISTINCT vs.name SEPARATOR '||')
    FROM vendor_services vs
    WHERE vs.vendor_id = vendors.id
      AND vs.status = 'active'
  ) AS subcategories,

  (
    SELECT MIN(vs.price_min)
    FROM vendor_services vs
    WHERE vs.vendor_id = vendors.id
      AND vs.status = 'active'
  ) AS starting_price

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