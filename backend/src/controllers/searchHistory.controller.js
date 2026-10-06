const db = require("../config/database");

const getSearchHistory = async (req, res) => {
  try {
    const userId = Number(req.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    const [rows] = await db.execute(
      `
        SELECT
          id,
          search_query,
          created_at
        FROM search_history
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 3
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        id: row.id,
        searchQuery: row.search_query,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("GET /api/search-history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch search history.",
    });
  }
};

const addSearchHistory = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const searchQuery = String(req.body.searchQuery || "").trim();

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query is required.",
      });
    }

    if (searchQuery.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Search query is too long.",
      });
    }

    // Remove an existing identical search first.
    await db.execute(
      `
        DELETE FROM search_history
        WHERE user_id = ?
          AND LOWER(search_query) = LOWER(?)
      `,
      [userId, searchQuery]
    );

    // Insert it as the newest search.
    await db.execute(
      `
        INSERT INTO search_history (
          user_id,
          search_query
        )
        VALUES (?, ?)
      `,
      [userId, searchQuery]
    );

    // Keep only the latest 20 searches.
    await db.execute(
      `
        DELETE FROM search_history
        WHERE user_id = ?
          AND id NOT IN (
            SELECT id
            FROM (
              SELECT id
              FROM search_history
              WHERE user_id = ?
              ORDER BY created_at DESC, id DESC
              LIMIT 3
            ) AS recent_searches
          )
      `,
      [userId, userId]
    );

    return res.status(201).json({
      success: true,
      message: "Search history saved.",
    });
  } catch (error) {
    console.error("POST /api/search-history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save search history.",
    });
  }
};

const deleteSearchHistory = async (req, res) => {
  try {
    const userId = Number(req.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    await db.execute(
      `
        DELETE FROM search_history
        WHERE user_id = ?
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Search history cleared.",
    });
  } catch (error) {
    console.error("DELETE /api/search-history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear search history.",
    });
  }
};

module.exports = {
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
};