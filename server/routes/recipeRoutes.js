/* eslint-disable no-undef */

const express = require("express");

const upload = require("../middleware/uploadMiddleware");

const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadRecipeImages,
  createRecipe,
  getRecipeById,
  rateRecipe,
  updateRecipe,
  togglePublishRecipe,
  deleteRecipe,
  getMyRecipes,
  getUserRecipes,
  getRecipes,
  getFilterOptions,
} = require("../controllers/recipeController");

const router = express.Router();

// =====================================================
// FILTER OPTIONS
// =====================================================

router.get("/filters/options", getFilterOptions);

// =====================================================
// MY RECIPES
// Published + Unpublished
// =====================================================

router.get("/my", authMiddleware, getMyRecipes);

// =====================================================
// COMMUNITY RECIPES
// Only Published recipes
// =====================================================

router.get("/community", authMiddleware, getUserRecipes);

// =====================================================
// CLOUDINARY IMAGE UPLOAD
// =====================================================

router.post(
  "/upload-images",
  authMiddleware,
  upload.array("images", 6),
  uploadRecipeImages,
);

// =====================================================
// GET RECIPES
// Default = Archive
// Community query returns only published
// =====================================================

router.get("/", getRecipes);

// =====================================================
// CREATE RECIPE
// New recipe starts as unpublished
// =====================================================

router.post("/", authMiddleware, createRecipe);

// =====================================================
// PUBLISH / UNPUBLISH RECIPE
// =====================================================

router.patch("/:id/publish", authMiddleware, togglePublishRecipe);

// =====================================================
// RATE RECIPE
// =====================================================

router.post("/:id/rating", authMiddleware, rateRecipe);

// =====================================================
// UPDATE RECIPE
// =====================================================

router.put("/:id", authMiddleware, updateRecipe);

// =====================================================
// DELETE RECIPE
// =====================================================

router.delete("/:id", authMiddleware, deleteRecipe);

// =====================================================
// GET SINGLE RECIPE
// KEEP THIS LAST
// =====================================================

router.get("/:id", getRecipeById);

module.exports = router;
