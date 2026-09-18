const db = require("../config/database.js");

const getActiveVendorCategories = async (
  req,
  res
) => {
  try {
    const [categories] = await db.query(
      `
        SELECT
          id,
          name,
          icon,
          description
        FROM vendor_categories
        WHERE status = 'active'
        ORDER BY sort_order, name
      `
    );

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error(
      "Get vendor categories error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Could not retrieve vendor categories.",
    });
  }
};

module.exports = {
  getActiveVendorCategories,
};