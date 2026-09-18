require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const vendorRoutes = require("./routes/vendorRoutes");
const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/history.routes");
const vendorRegistrationRoutes = require("./routes/vendorRegistrationRoutes.js");
const vendorCategoryRoutes = require("./routes/vendorCategoryRoutes.js");
const vendorPublicRoutes = require("./routes/vendorPublicRoutes.js");
const vendorImageRoutes = require("./routes/vendorImageRoutes.js");
const uploadErrorHandler = require("./middleware/uploadErrorHandler.js");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL?.replace(/\/$/, ""),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const error = new Error("Not allowed by CORS");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (req, res) =>
  res.status(200).json({ success: true, message: "Milieu Global Backend API is running" })
);
app.get("/api/health", (req, res) =>
  res.status(200).json({ success: true, status: "ok" })
);

app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/vendor-registrations", vendorRegistrationRoutes);
app.use("/api/vendor-categories", vendorCategoryRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/vendor-directory", vendorPublicRoutes);
app.use("/api/images", vendorImageRoutes);

app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
);

app.use(uploadErrorHandler);

app.use((error, req, res, next) => {
  console.error("Unhandled application error:", error);
  if (res.headersSent) return next(error);
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "Request origin is not allowed." });
  }
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("MySQL connected successfully!");
    connection.release();
    connection = null;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Allowed CORS origins:", allowedOrigins);
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("MySQL connection failed!");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
