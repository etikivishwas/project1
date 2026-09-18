const db = require("../config/database");

const allowedStatuses = [
  "requested",
  "contacted",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

const getUserHistory = async (req, res) => {
  try {
    const userId = Number(req.query.userId || 1);
    const status = req.query.status
      ? String(req.query.status).trim().toLowerCase()
      : "";

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid userId is required",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid history status",
      });
    }

    let query = `
      SELECT
        sh.id,
        sh.user_id,
        sh.vendor_id,
        v.name AS vendor_name,
        v.image_url AS vendor_image,
        sh.service_id,
        COALESCE(s.name, v.service_type, 'General Service') AS service_name,
        sh.status,
        sh.interaction_type,
        sh.service_date,
        sh.notes,
        sh.created_at,
        sh.updated_at
      FROM service_history sh
      INNER JOIN vendors v
        ON v.id = sh.vendor_id
      LEFT JOIN services s
        ON s.id = sh.service_id
      WHERE sh.user_id = ?
    `;

    const params = [userId];

    if (status) {
      query += " AND sh.status = ?";
      params.push(status);
    }

    query += `
      ORDER BY
        sh.service_date DESC,
        sh.created_at DESC,
        sh.id DESC
    `;

    const [rows] = await db.execute(query, params);

    const history = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      serviceId: row.service_id,
      serviceName: row.service_name,
      status: row.status,
      interactionType: row.interaction_type,
      serviceDate: row.service_date,
      image: row.vendor_image,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("GET /api/history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service history",
    });
  }
};

module.exports = {
  getUserHistory,
};
