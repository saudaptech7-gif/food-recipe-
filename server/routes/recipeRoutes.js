/* eslint-disable no-undef */
const express = require("express");
const Recipe = require("../models/Recipe");

const upload = require("../middleware/uploadMiddleware");
const { uploadRecipeImages } = require("../controllers/recipeController");

const router = express.Router();

// GET all archive recipes
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find();

    return res.status(200).json(recipes);
  } catch (error) {
    console.error("Fetch recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipes",
    });
  }
});

// Upload recipe images
router.post("/upload-images", upload.array("images", 6), uploadRecipeImages);

module.exports = router;
