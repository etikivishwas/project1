const db = require("../config/database");

const getUserHistory = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }


    // -------------------------------------------------
    // Optional status filter
    // -------------------------------------------------

    const { status } = req.query;


    const allowedStatuses = [
      "requested",
      "contacted",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
    ];


    if (
      status &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid history status",
      });
    }


    // -------------------------------------------------
    // Base query
    // -------------------------------------------------

    let query = `
      SELECT
        sh.id,
        sh.user_id,

        v.id AS vendor_id,
        v.name AS vendor_name,
        v.image_url AS vendor_image,

        s.id AS service_id,
        s.name AS service_name,

        sh.status,
        sh.interaction_type,
        sh.service_date,
        sh.notes,

        sh.created_at,
        sh.updated_at

      FROM service_history sh

      INNER JOIN vendors v
        ON sh.vendor_id = v.id

      LEFT JOIN services s
        ON sh.service_id = s.id

      WHERE sh.user_id = ?
    `;


    const params = [userId];


    // -------------------------------------------------
    // Status filter
    // -------------------------------------------------

    if (status) {
      query += `
        AND sh.status = ?
      `;

      params.push(status);
    }


    // -------------------------------------------------
    // Latest history first
    // -------------------------------------------------

    query += `
      ORDER BY
        sh.service_date DESC,
        sh.id DESC
    `;


    // -------------------------------------------------
    // Execute query
    // -------------------------------------------------

    const [rows] = await db.execute(
      query,
      params
    );


    // -------------------------------------------------
    // Format response for frontend
    // -------------------------------------------------

    const history = rows.map((row) => ({
      id: row.id,

      vendorId: row.vendor_id,

      vendorName: row.vendor_name,

      serviceId: row.service_id,

      serviceName: row.service_name,

      status: row.status,

      interactionType: row.interaction_type,

      serviceDate: row.service_date,

      image: row.vendor_image,

      notes: row.notes,
    }));


    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });

  } catch (error) {

    console.error(
      "GET /api/history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service history",
    });
  }
};


module.exports = {
  getUserHistory,
};