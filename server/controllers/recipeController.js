/* eslint-disable no-undef */

const mongoose = require("mongoose");

const Recipe = require("../models/Recipe");
const cloudinary = require("../config/cloudinary");

// =====================================================
// HELPERS
// =====================================================

const escapeRegex = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeText = (value = "") => {
  return String(value).trim().replace(/\s+/g, " ");
};

const createExactTextRegex = (value = "") => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  const escapedValue = escapeRegex(normalizedValue);

  const pattern = escapedValue.replace(/\\ /g, "\\s+");

  return new RegExp(`^${pattern}$`, "i");
};

const normalizeOptions = (items = []) => {
  const unique = new Map();

  items
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLowerCase();

      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });

  return Array.from(unique.values()).sort((a, b) =>
    a.localeCompare(b),
  );
};

const removeDuplicateRecipes = (recipes = []) => {
  if (!Array.isArray(recipes)) {
    return [];
  }

  const seen = new Set();

  return recipes.filter((recipe) => {
    if (!recipe) {
      return false;
    }

    const uniqueKey =
      recipe._id ||
      recipe.id ||
      `${recipe.name || ""}-${recipe.author || ""}-${recipe.image || ""}`;

    const key = String(uniqueKey);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

// =====================================================
// CLOUDINARY IMAGE UPLOAD
// =====================================================

const uploadRecipeImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please select at least one image.",
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "savorly-recipes",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(file.buffer);
      });

      uploadedImages.push(result.secure_url);
    }

    return res.status(200).json({
      message: "Images uploaded successfully.",
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    return res.status(500).json({
      message: "Failed to upload recipe images.",
    });
  }
};

// =====================================================
// CREATE RECIPE
// =====================================================

const createRecipe = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      mainCategory,
      difficulty,
      prepTime,
      cookTime,
      servings,
      serves,
      ingredients,
      steps,
      nutrients,
      images,
      image,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: "Recipe name is required.",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const cleanImages = Array.isArray(images)
      ? images.filter(Boolean).slice(0, 6)
      : [];

    const recipe = await Recipe.create({
      name: String(name).trim(),

      description: description
        ? String(description).trim()
        : "",

      category: category
        ? String(category).trim()
        : "",

      mainCategory: mainCategory
        ? String(mainCategory).trim()
        : category
          ? String(category).trim()
          : "",

      difficulty: difficulty
        ? String(difficulty).trim()
        : "",

      prepTime: prepTime
        ? String(prepTime).trim()
        : "",

      cookTime: cookTime
        ? String(cookTime).trim()
        : "",

      servings: Number(servings) || 0,

      serves: Number(serves) || Number(servings) || 0,

      ingredients: Array.isArray(ingredients)
        ? ingredients.filter(
            (item) => item && String(item).trim(),
          )
        : [],

      steps: Array.isArray(steps)
        ? steps.filter(
            (item) => item && String(item).trim(),
          )
        : [],

      nutrients: nutrients || {},

      images: cleanImages,

      image:
        cleanImages[0] ||
        image ||
        "",

      recipeType: "community",

      createdBy: req.userId,

      // Every newly created recipe starts private.
      isPublished: false,

      rating: 0,
      voteCount: 0,
      averageRating: 0,
      ratingCount: 0,
      ratings: [],
    });

    return res.status(201).json({
      message: "Recipe created successfully.",
      recipe,
    });
  } catch (error) {
    console.error("Create recipe error:", error);

    return res.status(500).json({
      message: "Failed to create recipe.",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE RECIPE
// =====================================================

const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    let recipe = null;

    // Community recipes use MongoDB _id.
    if (mongoose.Types.ObjectId.isValid(id)) {
      recipe = await Recipe.findById(id)
        .populate("createdBy", "name email")
        .lean();
    }

    // Archive recipes can use their custom id.
    if (!recipe) {
      recipe = await Recipe.findOne({
        id: String(id),
      })
        .populate("createdBy", "name email")
        .lean();
    }

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    return res.status(200).json({
      recipe,
    });
  } catch (error) {
    console.error("Get recipe error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipe.",
    });
  }
};

// =====================================================
// RATE RECIPE
// =====================================================

const rateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (String(recipe.createdBy) === String(req.userId)) {
      return res.status(403).json({
        message: "You cannot rate your own recipe.",
      });
    }

    const existingRatingIndex = recipe.ratings.findIndex(
      (item) =>
        String(item.user) === String(req.userId),
    );

    if (existingRatingIndex >= 0) {
      recipe.ratings[existingRatingIndex].value =
        numericRating;
    } else {
      recipe.ratings.push({
        user: req.userId,
        value: numericRating,
      });
    }

    const totalRating = recipe.ratings.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0,
    );

    const ratingCount = recipe.ratings.length;

    const averageRating =
      ratingCount > 0
        ? Number(
            (totalRating / ratingCount).toFixed(1),
          )
        : 0;

    recipe.averageRating = averageRating;
    recipe.rating = averageRating;
    recipe.ratingCount = ratingCount;
    recipe.voteCount = ratingCount;

    await recipe.save();

    return res.status(200).json({
      message: "Rating saved successfully.",
      recipe,
    });
  } catch (error) {
    console.error("Rate recipe error:", error);

    return res.status(500).json({
      message: "Failed to save rating.",
    });
  }
};

// =====================================================
// UPDATE RECIPE
// =====================================================

const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (String(recipe.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message: "You can only edit your own recipe.",
      });
    }

    const {
      name,
      description,
      category,
      mainCategory,
      difficulty,
      prepTime,
      cookTime,
      servings,
      serves,
      ingredients,
      steps,
      nutrients,
      images,
      image,
    } = req.body;

    if (name !== undefined) {
      recipe.name = String(name).trim();
    }

    if (description !== undefined) {
      recipe.description = String(description).trim();
    }

    if (category !== undefined) {
      recipe.category = String(category).trim();
    }

    if (mainCategory !== undefined) {
      recipe.mainCategory = String(mainCategory).trim();
    }

    if (difficulty !== undefined) {
      recipe.difficulty = String(difficulty).trim();
    }

    if (prepTime !== undefined) {
      recipe.prepTime = String(prepTime).trim();
    }

    if (cookTime !== undefined) {
      recipe.cookTime = String(cookTime).trim();
    }

    if (servings !== undefined) {
      recipe.servings = Number(servings) || 0;
    }

    if (serves !== undefined) {
      recipe.serves = Number(serves) || 0;
    }

    if (Array.isArray(ingredients)) {
      recipe.ingredients = ingredients.filter(
        (item) => item && String(item).trim(),
      );
    }

    if (Array.isArray(steps)) {
      recipe.steps = steps.filter(
        (item) => item && String(item).trim(),
      );
    }

    if (nutrients !== undefined) {
      recipe.nutrients = nutrients || {};
    }

    if (Array.isArray(images)) {
      recipe.images = images
        .filter(Boolean)
        .slice(0, 6);

      recipe.image = recipe.images[0] || "";
    } else if (image !== undefined) {
      recipe.image = image || "";
    }

    // Keep the current publish status.
    // Publishing is handled only by /publish route.

    await recipe.save();

    return res.status(200).json({
      message: "Recipe updated successfully.",
      recipe,
    });
  } catch (error) {
    console.error("Update recipe error:", error);

    return res.status(500).json({
      message: "Failed to update recipe.",
    });
  }
};

// =====================================================
// PUBLISH / UNPUBLISH RECIPE
// =====================================================

const togglePublishRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (String(recipe.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message:
          "You can only publish your own recipe.",
      });
    }

    recipe.recipeType = "community";

    recipe.isPublished = Boolean(isPublished);

    await recipe.save();

    console.log(
      "Publish status updated:",
      {
        id: recipe._id,
        name: recipe.name,
        recipeType: recipe.recipeType,
        isPublished: recipe.isPublished,
        createdBy: recipe.createdBy,
      },
    );

    return res.status(200).json({
      message: recipe.isPublished
        ? "Recipe published successfully."
        : "Recipe unpublished successfully.",
      recipe,
    });
  } catch (error) {
    console.error(
      "Toggle publish recipe error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to update publish status.",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE RECIPE
// =====================================================

const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (String(recipe.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message:
          "You can only delete your own recipe.",
      });
    }

    await Recipe.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Recipe deleted successfully.",
    });
  } catch (error) {
    console.error("Delete recipe error:", error);

    return res.status(500).json({
      message: "Failed to delete recipe.",
    });
  }
};

// =====================================================
// GET MY RECIPES
// Published + Unpublished
// =====================================================

const getMyRecipes = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const recipes = await Recipe.find({
      recipeType: "community",
      createdBy: req.userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    console.log(
      "MY RECIPES:",
      recipes.map((recipe) => ({
        id: recipe._id,
        name: recipe.name,
        recipeType: recipe.recipeType,
        isPublished: recipe.isPublished,
        createdBy: recipe.createdBy,
      })),
    );

    return res.status(200).json({
      recipes: removeDuplicateRecipes(recipes),
    });
  } catch (error) {
    console.error("Get my recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch my recipes.",
    });
  }
};

// =====================================================
// GET USER / COMMUNITY RECIPES
// Only Published recipes
// Includes current user's published recipes too.
// =====================================================

const getUserRecipes = async (req, res) => {
  try {
    console.log("=================================");
    console.log("GET USER RECIPES");
    console.log("Logged in user:", req.userId);

    const recipes = await Recipe.find({
      recipeType: "community",
      isPublished: true,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    console.log("Found recipes:", recipes.length);

    console.log(
      recipes.map((recipe) => ({
        id: recipe._id,
        name: recipe.name,
        recipeType: recipe.recipeType,
        isPublished: recipe.isPublished,
        createdBy: recipe.createdBy,
      })),
    );

    console.log("=================================");

    return res.status(200).json({
      recipes: removeDuplicateRecipes(recipes),
    });
  } catch (error) {
    console.error(
      "Get user recipes error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch user recipes.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ARCHIVE RECIPES
// =====================================================

const getRecipes = async (req, res) => {
  try {
    const {
      category = "",
      search = "",
      difficulty = "",
      subcategory = "",
      dishType = "",
      recipeType = "archive",
      page = 1,
      limit = 6,
    } = req.query;

    const currentPage =
      Math.max(Number(page) || 1, 1);

    const itemsPerPage =
      Math.max(Number(limit) || 6, 1);

    const skip =
      (currentPage - 1) * itemsPerPage;

    const query = {};

    // -------------------------------------------------
    // RECIPE TYPE
    // -------------------------------------------------

    if (recipeType === "community") {
      query.recipeType = "community";
      query.isPublished = true;
    } else {
      query.$or = [
        {
          recipeType: "archive",
        },
        {
          recipeType: {
            $exists: false,
          },
        },
        {
          recipeType: null,
        },
      ];
    }

    // -------------------------------------------------
    // CATEGORY
    // -------------------------------------------------

    if (category.trim()) {
      const categoryRegex =
        createExactTextRegex(category);

      if (categoryRegex) {
        query.$and = query.$and || [];

        query.$and.push({
          $or: [
            {
              category: categoryRegex,
            },
            {
              mainCategory: categoryRegex,
            },
            {
              maincategory: categoryRegex,
            },
            {
              subcategory: categoryRegex,
            },
          ],
        });
      }
    }

    // -------------------------------------------------
    // DIFFICULTY
    // -------------------------------------------------

    if (difficulty.trim()) {
      const difficultyRegex =
        createExactTextRegex(difficulty);

      if (difficultyRegex) {
        query.difficulty = difficultyRegex;
      }
    }

    // -------------------------------------------------
    // SUBCATEGORY
    // -------------------------------------------------

    if (subcategory.trim()) {
      const subcategoryRegex =
        createExactTextRegex(subcategory);

      if (subcategoryRegex) {
        query.subcategory = subcategoryRegex;
      }
    }

    // -------------------------------------------------
    // DISH TYPE
    // -------------------------------------------------

    if (dishType.trim()) {
      const dishTypeRegex =
        createExactTextRegex(dishType);

      if (dishTypeRegex) {
        query.dishType = dishTypeRegex;
      }
    }

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    if (search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i",
      );

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
        ],
      });
    }

    const totalRecipes =
      await Recipe.countDocuments(query);

    const recipes = await Recipe.find(query)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip(skip)
      .limit(itemsPerPage)
      .lean();

    const totalPages =
      Math.ceil(
        totalRecipes / itemsPerPage,
      ) || 1;

    return res.status(200).json({
      recipes: removeDuplicateRecipes(recipes),
      currentPage,
      totalPages,
      totalRecipes,
    });
  } catch (error) {
    console.error("Get recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipes.",
      error: error.message,
    });
  }
};

// =====================================================
// FILTER OPTIONS
// =====================================================

const getFilterOptions = async (req, res) => {
  try {
    const archiveFilter = {
      $or: [
        {
          recipeType: "archive",
        },
        {
          recipeType: {
            $exists: false,
          },
        },
        {
          recipeType: null,
        },
      ],
    };

    const [difficulties, subcategories, dishTypes] =
      await Promise.all([
        Recipe.distinct(
          "difficulty",
          archiveFilter,
        ),

        Recipe.distinct(
          "subcategory",
          archiveFilter,
        ),

        Recipe.distinct(
          "dishType",
          archiveFilter,
        ),
      ]);

    return res.status(200).json({
      difficulties:
        normalizeOptions(difficulties),

      subcategories:
        normalizeOptions(subcategories),

      dishTypes:
        normalizeOptions(dishTypes),
    });
  } catch (error) {
    console.error(
      "Get filter options error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch filter options.",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
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
};
