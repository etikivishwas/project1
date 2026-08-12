require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/database");
const vendorRoutes = require("./routes/vendorRoutes");
const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/history.routes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL?.replace(/\/$/, ""),
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// =====================================================
// BASIC ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Milieu Global Backend API is running",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// =====================================================
// AUTH ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// VENDOR ROUTES
// =====================================================

app.use("/api/vendors", vendorRoutes);

// =====================================================
// HISTORY ROUTES
// =====================================================

app.use("/api/history", historyRoutes);

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test MySQL connection
    const connection = await db.getConnection();

    console.log("MySQL connected successfully!");

    connection.release();

    // Start backend server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Allowed CORS origins:", allowedOrigins);
    });
  } catch (error) {
    console.error("MySQL connection failed!");
    console.error(error.message);
  }
}

startServer();