/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = decoded.user || decoded;

    req.userId =
      user.userId ||
      user.id ||
      user._id ||
      decoded.userId ||
      decoded.id ||
      decoded._id ||
      decoded.sub;

    req.user = user;
  } catch (error) {
    // Invalid/expired token par public recipe viewing allow rahegi.
    req.userId = undefined;
    req.user = undefined;
  }

  return next();
};

module.exports = optionalAuthMiddleware;
