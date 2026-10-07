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

const app = express();

// =====================================
// ALLOWED FRONTENDS
// =====================================

const allowedOrigins = [
  "http://localhost:5173",

  "https://food-recipe-two-flax.vercel.app",
];

// =====================================
// CORS
// =====================================

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },

    credentials: true,
  }),
);

// =====================================
// BODY PARSER
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
// COOKIE
// =====================================

app.use(cookieParser());

// =====================================
// DATABASE
// =====================================

app.use(async (req, res, next) => {
  try {
    await connectDB();

    next();
  } catch (error) {
    console.error("Database connection error:", error.message);

    return res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// =====================================
// ROUTES
// =====================================

app.use("/api/recipes", recipeRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/favorites", favoriteRoutes);

// =====================================
// HEALTH CHECK
// =====================================

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Food API is running",
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

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS origin not allowed",
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
