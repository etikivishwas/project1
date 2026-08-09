const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const db = require("./config/database");
const vendorRoutes = require("./routes/vendorRoutes");

dotenv.config();

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

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
// VENDOR ROUTES
// =====================================================

app.use("/api/vendors", vendorRoutes);


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
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {

    console.error("MySQL connection failed!");
    console.error(error.message);

  }
}

startServer();