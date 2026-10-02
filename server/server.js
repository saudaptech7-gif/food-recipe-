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

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://YOUR-FRONTEND-VERCEL-URL.vercel.app",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/recipes", recipeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Food API is running",
  });
});

// Local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel
module.exports = app;
