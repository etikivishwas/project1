// Adapter placed after your existing JWT authentication middleware.
// The existing middleware must set req.user, req.auth, or req.userId.
module.exports = function requireUser(req, res, next) {
  const userId = Number(
    req.user?.id ||
      req.user?.userId ||
      req.auth?.id ||
      req.auth?.userId ||
      req.userId
  );

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required.",
    });
  }

  req.currentUserId = userId;
  return next();
};