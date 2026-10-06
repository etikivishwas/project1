const db = require("../config/database.js");

const getActiveVendorCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `
        SELECT
          id,
          name,
          icon,
          is_active
        FROM service_categories
        WHERE is_active = 1
        ORDER BY created_at ASC, name ASC
      `
    );

    const [services] = await db.query(
      `
        SELECT
          id,
          category_id,
          name,
          description
        FROM services
        WHERE is_active = 1
        ORDER BY name ASC
      `
    );

    const categoriesWithServices = categories.map(
      (category) => ({
        ...category,
        subcategories: services.filter(
          (service) =>
            Number(service.category_id) ===
            Number(category.id)
        ),
      })
    );

    return res.status(200).json({
      success: true,
      count: categoriesWithServices.length,
      data: categoriesWithServices,
    });
  } catch (error) {
    console.error(
      "Get service categories error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not retrieve service categories.",
    });
  }
};

module.exports = {
  getActiveVendorCategories,
};