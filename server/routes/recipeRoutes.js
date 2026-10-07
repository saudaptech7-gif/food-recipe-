/* eslint-disable no-undef */

const express = require("express");

const Recipe = require("../models/Recipe");

const upload = require("../middleware/uploadMiddleware");

const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadRecipeImages,
  createRecipe,
  getRecipeById,
  rateRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
  getUserRecipes,
  getRecipes,
  getFilterOptions,
} = require("../controllers/recipeController");

const router = express.Router();

/* =====================================================
   FILTER OPTIONS
   ONLY ARCHIVE RECIPES
===================================================== */

router.get("/filters/options", getFilterOptions);

/* =====================================================
   MY RECIPES
===================================================== */

router.get("/my", authMiddleware, getMyRecipes);

/* =====================================================
   ALL USER RECIPES
===================================================== */

router.get("/community", authMiddleware, getUserRecipes);

/* =====================================================
   CLOUDINARY IMAGE UPLOAD
===================================================== */

router.post(
  "/upload-images",
  authMiddleware,
  upload.array("images", 6),
  uploadRecipeImages,
);

/* =====================================================
   GET RECIPES
   DEFAULT = ARCHIVE
===================================================== */

router.get("/", getRecipes);

/* =====================================================
   CREATE RECIPE
===================================================== */

router.post("/", authMiddleware, createRecipe);

/* =====================================================
   RATE RECIPE
===================================================== */

router.post("/:id/rating", authMiddleware, rateRecipe);

/* =====================================================
   UPDATE RECIPE
===================================================== */

router.put("/:id", authMiddleware, updateRecipe);

/* =====================================================
   DELETE RECIPE
===================================================== */

router.delete("/:id", authMiddleware, deleteRecipe);

/* =====================================================
   SINGLE RECIPE
   IMPORTANT: KEEP THIS LAST
===================================================== */

router.get("/:id", getRecipeById);

module.exports = router;
