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
} = require("../controllers/recipeController");

const router = express.Router();

// =====================================
// FILTER OPTIONS
// ONLY ARCHIVE RECIPES
// =====================================

router.get("/filters/options", async (req, res) => {
  try {
    const archiveFilter = {
      recipeType: "archive",
    };

    const [difficulties, subcategories, dishTypes, categories] =
      await Promise.all([
        Recipe.distinct("difficulty", {
          ...archiveFilter,

          difficulty: {
            $exists: true,
            $ne: "",
          },
        }),

        Recipe.distinct("subcategory", {
          ...archiveFilter,

          subcategory: {
            $exists: true,
            $ne: "",
          },
        }),

        Recipe.distinct("dishType", {
          ...archiveFilter,

          dishType: {
            $exists: true,
            $ne: "",
          },
        }),

        Recipe.distinct("mainCategory", {
          ...archiveFilter,

          mainCategory: {
            $exists: true,
            $ne: "",
          },
        }),
      ]);

    return res.status(200).json({
      difficulties: difficulties.filter(Boolean).sort(),

      subcategories: subcategories.filter(Boolean).sort(),

      dishTypes: dishTypes.filter(Boolean).sort(),

      categories: categories.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("Filter options error:", error);

    return res.status(500).json({
      message: "Failed to fetch filter options",
    });
  }
});

// =====================================
// MY RECIPES
// =====================================

router.get("/my", authMiddleware, getMyRecipes);

// =====================================
// ALL USER RECIPES
// INCLUDING CURRENT USER
// =====================================

router.get("/community", authMiddleware, getUserRecipes);

// =====================================
// CLOUDINARY UPLOAD
// =====================================

router.post(
  "/upload-images",

  authMiddleware,

  upload.array("images", 6),

  uploadRecipeImages,
);

// =====================================
// CREATE
// =====================================

router.post("/", authMiddleware, createRecipe);

// =====================================
// RATE
// =====================================

router.post("/:id/rating", authMiddleware, rateRecipe);

// =====================================
// UPDATE
// =====================================

router.put("/:id", authMiddleware, updateRecipe);

// =====================================
// DELETE
// =====================================

router.delete("/:id", authMiddleware, deleteRecipe);

// =====================================
// GET RECIPES
// =====================================

router.get("/", async (req, res) => {
  try {
    const {
      category = "",
      search = "",
      difficulty = "",
      subcategory = "",
      dishType = "",
      recipeType = "archive",
    } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 50);

    const skip = (page - 1) * limit;

    const query = {};

    // =================================
    // TYPE
    // =================================

    if (recipeType === "community") {
      query.recipeType = "community";
    } else {
      query.recipeType = "archive";

      // Only archive recipes having nutrition
      query.$and = [
        {
          $or: [
            {
              "nutrients.kcal": {
                $exists: true,
                $ne: "",
              },
            },

            {
              "nutrients.fat": {
                $exists: true,
                $ne: "",
              },
            },

            {
              "nutrients.saturates": {
                $exists: true,
                $ne: "",
              },
            },

            {
              "nutrients.carbs": {
                $exists: true,
                $ne: "",
              },
            },

            {
              "nutrients.sugars": {
                $exists: true,
                $ne: "",
              },
            },

            {
              "nutrients.fibre": {
                $exists: true,
                $ne: "",
              },
            },

            {
              "nutrients.protein": {
                $exists: true,
                $ne: "",
              },
            },

            {
              "nutrients.salt": {
                $exists: true,
                $ne: "",
              },
            },
          ],
        },
      ];
    }

    // =================================
    // CATEGORY
    // =================================

    if (category.trim()) {
      const categoryValue = category.trim();

      const aliases = {
        Baking: ["Baking", "baking"],

        Budget: ["Budget", "budget", "Budgets", "budgets"],

        Recipes: ["Recipes", "recipes"],

        Inspiration: ["Inspiration", "inspiration"],

        Health: ["Health", "health"],
      };

      const categoryValues = aliases[categoryValue] || [categoryValue];

      query.$and = query.$and || [];

      query.$and.push({
        $or: [
          {
            mainCategory: {
              $in: categoryValues,
            },
          },

          {
            category: {
              $in: categoryValues,
            },
          },
        ],
      });
    }

    // =================================
    // DIFFICULTY
    // =================================

    if (difficulty.trim()) {
      query.difficulty = difficulty.trim();
    }

    // =================================
    // SUBCATEGORY
    // =================================

    if (subcategory.trim()) {
      query.subcategory = subcategory.trim();
    }

    // =================================
    // DISH TYPE
    // =================================

    if (dishType.trim()) {
      query.dishType = dishType.trim();
    }

    // =================================
    // SEARCH
    // =================================

    if (search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(escapedSearch, "i");

      query.$and = query.$and || [];

      query.$and.push({
        $or: [
          {
            name: searchRegex,
          },

          {
            description: searchRegex,
          },

          {
            author: searchRegex,
          },

          {
            category: searchRegex,
          },

          {
            mainCategory: searchRegex,
          },

          {
            subcategory: searchRegex,
          },

          {
            dishType: searchRegex,
          },

          {
            difficulty: searchRegex,
          },
        ],
      });
    }

    // =================================
    // COUNT
    // =================================

    const totalRecipes = await Recipe.countDocuments(query);

    // =================================
    // FETCH
    // =================================

    const recipes = await Recipe.find(query)
      .populate("createdBy", "name email chef")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.max(Math.ceil(totalRecipes / limit), 1);

    return res.status(200).json({
      recipes,

      currentPage: page,

      totalPages,

      totalRecipes,
    });
  } catch (error) {
    console.error("Fetch recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipes",
    });
  }
});

// =====================================
// SINGLE RECIPE
// =====================================

router.get("/:id", getRecipeById);

module.exports = router;
