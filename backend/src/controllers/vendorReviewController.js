const db = require("../config/database");

const submitVendorReview = async (req, res) => {
  const vendorId = Number(req.params.vendorId);
  const userId = Number(req.currentUserId);
  const rating = Number(req.body.rating);
  const bookedWithProvider = req.body.bookedWithProvider === true;

  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid vendor ID is required.",
    });
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required.",
    });
  }

  if (!bookedWithProvider) {
    return res.status(400).json({
      success: false,
      message: "Confirm that you booked with this provider before rating.",
    });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be an integer from 1 to 5.",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [vendors] = await connection.query(
      `SELECT id
       FROM vendors
       WHERE id = ?
         AND registration_status = 'approved'
         AND is_active = 1
       LIMIT 1`,
      [vendorId]
    );

    if (!vendors[0]) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "An active approved vendor was not found.",
      });
    }

    const [users] = await connection.query(
      `SELECT id, name
       FROM users
       WHERE id = ?
         AND account_status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (!users[0]) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "An active user account was not found.",
      });
    }

    const [completedBookings] = await connection.query(
      `SELECT id
       FROM service_history
       WHERE user_id = ?
         AND vendor_id = ?
         AND interaction_type = 'booking'
         AND status = 'completed'
       ORDER BY service_date DESC, id DESC
       LIMIT 1`,
      [userId, vendorId]
    );

    const completedBooking = completedBookings[0] || null;

    await connection.query(
      `INSERT INTO vendor_panel_reviews
        (
          vendor_id,
          user_id,
          service_history_id,
          customer_name,
          rating,
          review_text,
          status
        )
       VALUES (?, ?, ?, ?, ?, NULL, 'published')
       ON DUPLICATE KEY UPDATE
         service_history_id = VALUES(service_history_id),
         customer_name = VALUES(customer_name),
         rating = VALUES(rating),
         status = 'published',
         updated_at = CURRENT_TIMESTAMP`,
      [
        vendorId,
        userId,
        completedBooking?.id || null,
        users[0].name || "Customer",
        rating,
      ]
    );

    const [summaryRows] = await connection.query(
      `SELECT
         ROUND(AVG(rating), 1) AS averageRating,
         COUNT(*) AS reviewCount
       FROM vendor_panel_reviews
       WHERE vendor_id = ?
         AND status = 'published'`,
      [vendorId]
    );

    const averageRating = Number(summaryRows[0]?.averageRating || 0);
    const reviewCount = Number(summaryRows[0]?.reviewCount || 0);

    await connection.query(
      `UPDATE vendors
       SET rating = ?
       WHERE id = ?`,
      [averageRating, vendorId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback.",
      data: {
        rating,
        averageRating,
        reviewCount,
        verifiedBooking: Boolean(completedBooking),
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Review rollback error:", rollbackError);
    }

    console.error("submitVendorReview error:", error);

    return res.status(500).json({
      success: false,
      message: "Feedback could not be submitted.",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  submitVendorReview,
};