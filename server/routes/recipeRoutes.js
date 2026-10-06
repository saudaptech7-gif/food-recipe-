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

// =====================================
// GET FILTER OPTIONS
// =====================================

router.get("/filters/options", async (req, res) => {
  try {
    const difficulties = await Recipe.distinct("difficulty", {
      difficulty: { $exists: true, $ne: "" },
    });

    const subcategories = await Recipe.distinct("subcategory", {
      subcategory: { $exists: true, $ne: "" },
    });

    const dishTypes = await Recipe.distinct("dishType", {
      dishType: { $exists: true, $ne: "" },
    });

    return res.status(200).json({
      difficulties: difficulties.filter(Boolean).sort(),
      subcategories: subcategories.filter(Boolean).sort(),
      dishTypes: dishTypes.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("Fetch filter options error:", error);

    return res.status(500).json({
      message: "Failed to fetch filter options",
    });
  }
});

// =====================================
// GET ALL RECIPES
// =====================================

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

// =====================================
// UPLOAD RECIPE IMAGES
// =====================================

router.post("/upload-images", upload.array("images", 6), uploadRecipeImages);

// =====================================
// CREATE COMMUNITY RECIPE
// =====================================

router.post("/", authMiddleware, createRecipe);

module.exports = router;
