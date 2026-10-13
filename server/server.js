
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const connectDB = require("./config/db");

const recipeRoutes = require("./routes/recipeRoutes");
const authRoutes = require("./routes/authroutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const socialRoutes = require("./routes/socialroutes");

const app = express();

// =====================================
// ALLOWED FRONTENDS
// =====================================

const normalizeOrigin = (origin) =>
  String(origin || "").trim().replace(/\/+$/, "");

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://food-recipe-two-flax.vercel.app",

  // Optional Vercel environment variable.
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean),
]);

// =====================================
// CORS CONFIGURATION
// Must be before all routes.
// =====================================

const corsOptions = {
  origin: (origin, callback) => {
    // Requests without an Origin header are allowed.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn("CORS origin rejected:", origin);

    // Do not throw an error from the CORS callback.
    return callback(null, false);
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

// Apply CORS before body parsing, database checks and routes.
app.use(cors(corsOptions));

// =====================================
// BODY PARSERS
// =====================================

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  }),
);

// =====================================
// COOKIE PARSER
// =====================================

app.use(cookieParser());

// =====================================
// HEALTH CHECK
// Does not require a database connection.
// =====================================

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Food API is running",
  });
});

// =====================================
// DATABASE CONNECTION
// =====================================

app.use(async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (error) {
    console.error(
      "Database connection error:",
      error.message,
    );

    return res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// =====================================
// API ROUTES
// =====================================

app.use("/api/recipes", recipeRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/favorites", favoriteRoutes);

app.use("/api/social", socialRoutes);

// =====================================
// NOT FOUND
// =====================================

app.use((req, res) => {
  return res.status(404).json({
    message: "API endpoint not found",
  });
});

// =====================================
// ERROR HANDLER
// =====================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error.name === "MulterError") {
    return res.status(400).json({
      message: error.message || "Image upload error",
    });
  }

  if (error.message === "Only image files are allowed") {
    return res.status(400).json({
      message: "Only image files are allowed",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
});

// =====================================
// LOCAL SERVER
// =====================================

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
