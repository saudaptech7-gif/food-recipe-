/* eslint-disable no-undef */
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
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

// FILTER OPTIONS
router.get("/filters/options", getFilterOptions);

// MY RECIPES
router.get("/my", authMiddleware, getMyRecipes);

// COMMUNITY RECIPES
router.get("/community", authMiddleware, getUserRecipes);

// SINGLE RECIPE DETAILS
router.get("/:id", optionalAuthMiddleware, getRecipeById);
// CLOUDINARY IMAGE UPLOAD
router.post(
  "/upload-images",
  authMiddleware,
  upload.array("images", 6),
  uploadRecipeImages,
);

// GET RECIPES
router.get("/", getRecipes);

// CREATE RECIPE
router.post("/", authMiddleware, createRecipe);

// PUBLISH / UNPUBLISH RECIPE
router.patch("/:id/publish", authMiddleware, togglePublishRecipe);

// RATE RECIPE
router.post("/:id/rating", authMiddleware, rateRecipe);

// UPDATE RECIPE
router.put("/:id", authMiddleware, updateRecipe);

// DELETE RECIPE
router.delete("/:id", authMiddleware, deleteRecipe);

// GET SINGLE RECIPE — KEEP THIS LAST
router.get("/:id", getRecipeById);

module.exports = router;
