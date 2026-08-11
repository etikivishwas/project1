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

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
// START SERVER
// =====================================================

app.use(
  "/api/history",
  historyRoutes
);

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
    });
  } catch (error) {
    console.error("MySQL connection failed!");
    console.error(error.message);
  }
}

startServer();