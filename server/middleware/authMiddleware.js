/* eslint-disable no-undef */

const jwt = require("jsonwebtoken");

const authMiddleware = (
  req,
  res,
  next
) => {
  try {
    const token =
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing"
      );

      return res.status(500).json({
        message:
          "Authentication configuration error",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.userId) {
      return res.status(401).json({
        message:
          "Invalid authentication token",
      });
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;