/* eslint-disable no-undef */
const express = require("express");

const Recipe = require("../models/Recipe");

const upload = require("../middleware/uploadMiddleware");

const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadRecipeImages,
  createRecipe,
} = require("../controllers/recipeController");

const router = express.Router();

// =========================
// GET ALL RECIPES
// =========================

router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("createdBy", "name chef")
      .sort({ createdAt: -1 });

    return res.status(200).json(recipes);
  } catch (error) {
    console.error("Fetch recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipes",
    });
  }
});

// =========================
// UPLOAD RECIPE IMAGES
// =========================

router.post("/upload-images", upload.array("images", 6), uploadRecipeImages);

// =========================
// CREATE COMMUNITY RECIPE
// =========================

router.post("/", authMiddleware, createRecipe);

module.exports = router;
