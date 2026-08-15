const jwt = require("jsonwebtoken");

module.exports = function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (
      !header ||
      !header.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "No token provided.",
      });
    }

    const token = header.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.id;
    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};