/* eslint-disable no-undef */

const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");

const Recipe = require("../models/Recipe");

// ===============================
// UPLOAD RECIPE IMAGES
// ===============================
const uploadRecipeImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please select at least one image.",
      });
    }

    if (req.files.length > 6) {
      return res.status(400).json({
        message: "You can upload maximum 6 images.",
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "savorly/recipes",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary detailed error:", error);
              reject(error);
              return;
            }

            resolve(result);
          },
        );

        stream.end(file.buffer);
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
      message: error?.message || "Failed to upload recipe images.",
    });
  }
};

// ===============================
// GET RECIPES
// ARCHIVE RECIPES + FILTERS
// ===============================
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

    const currentPage = Math.max(Number(page) || 1, 1);
    const itemsPerPage = Math.max(Number(limit) || 6, 1);

    const filter = {
      recipeType,
    };

    if (category.trim()) {
      filter.category = {
        $regex: `^${category.trim()}$`,
        $options: "i",
      };
    }

    if (difficulty.trim()) {
      filter.difficulty = {
        $regex: `^${difficulty.trim()}$`,
        $options: "i",
      };
    }

    if (subcategory.trim()) {
      filter.subcategory = {
        $regex: `^${subcategory.trim()}$`,
        $options: "i",
      };
    }

    if (dishType.trim()) {
      filter.dishType = {
        $regex: `^${dishType.trim()}$`,
        $options: "i",
      };
    }

    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          author: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          category: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          mainCategory: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          subcategory: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          dishType: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const totalRecipes = await Recipe.countDocuments(filter);

    const totalPages = Math.max(Math.ceil(totalRecipes / itemsPerPage), 1);

    const recipes = await Recipe.find(filter)
      .sort({
        createdAt: -1,
        name: 1,
      })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .lean();

    return res.status(200).json({
      recipes,
      currentPage,
      totalPages,
      totalRecipes,
    });
  } catch (error) {
    console.error("Get recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipes.",
    });
  }
};

// ===============================
// FILTER OPTIONS
// ===============================
const getFilterOptions = async (req, res) => {
  try {
    const recipeType = req.query.recipeType || "archive";

    const filter = {
      recipeType,
    };

    const [difficulties, subcategories, dishTypes, categories] =
      await Promise.all([
        Recipe.distinct("difficulty", filter),
        Recipe.distinct("subcategory", filter),
        Recipe.distinct("dishType", filter),
        Recipe.distinct("category", filter),
      ]);

    return res.status(200).json({
      difficulties: difficulties.filter(Boolean).map(String).sort(),

      subcategories: subcategories.filter(Boolean).map(String).sort(),

      dishTypes: dishTypes.filter(Boolean).map(String).sort(),

      categories: categories.filter(Boolean).map(String).sort(),
    });
  } catch (error) {
    console.error("Get filter options error:", error);

    return res.status(500).json({
      message: "Failed to fetch filter options.",
    });
  }
};

// ===============================
// CREATE RECIPE
// ===============================
const createRecipe = async (req, res) => {
  try {
    const {
      name,
      description,
      ingredients,
      steps,
      nutrients,
      prepTime,
      cookTime,
      serves,
      servings,
      difficulty,
      subcategory,
      dishType,
      mainCategory,
      category,
      images,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Recipe name is required.",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Recipe description is required.",
      });
    }

    if (!difficulty || !difficulty.trim()) {
      return res.status(400).json({
        message: "Difficulty is required.",
      });
    }

    if (!prepTime || !prepTime.trim()) {
      return res.status(400).json({
        message: "Preparation time is required.",
      });
    }

    if (!cookTime || !cookTime.trim()) {
      return res.status(400).json({
        message: "Cooking time is required.",
      });
    }

    const parsedIngredients = Array.isArray(ingredients)
      ? ingredients.filter((item) => String(item).trim())
      : [];

    const parsedSteps = Array.isArray(steps)
      ? steps.filter((item) => String(item).trim())
      : [];

    if (parsedIngredients.length === 0) {
      return res.status(400).json({
        message: "At least one ingredient is required.",
      });
    }

    if (parsedSteps.length === 0) {
      return res.status(400).json({
        message: "At least one cooking step is required.",
      });
    }

    const parsedImages = Array.isArray(images)
      ? images.filter((image) => String(image).trim())
      : [];

    if (parsedImages.length === 0) {
      return res.status(400).json({
        message: "At least one recipe image is required.",
      });
    }

    if (parsedImages.length > 6) {
      return res.status(400).json({
        message: "You can upload maximum 6 images.",
      });
    }

    const parsedServings = Number(servings ?? serves ?? 0);

    const recipe = await Recipe.create({
      name: name.trim(),
      description: description.trim(),

      ingredients: parsedIngredients,
      steps: parsedSteps,

      nutrients: nutrients || {},

      times: {
        preparation: prepTime?.trim() || "",
        cooking: cookTime?.trim() || "",
      },

      prepTime: prepTime?.trim() || "",
      cookTime: cookTime?.trim() || "",

      serves: parsedServings,
      servings: parsedServings,

      difficulty: difficulty.trim(),
      subcategory: subcategory?.trim() || "",
      dishType: dishType?.trim() || "",
      mainCategory: mainCategory?.trim() || "",
      category: category?.trim() || "",

      images: parsedImages,
      image: parsedImages[0] || "",

      recipeType: "community",
      createdBy: req.userId,

      rating: 0,
      voteCount: 0,
      averageRating: 0,
      ratingCount: 0,
      ratings: [],
    });

    const populatedRecipe = await Recipe.findById(recipe._id).populate(
      "createdBy",
      "name email chef",
    );

    return res.status(201).json({
      message: "Recipe created successfully.",
      recipe: populatedRecipe,
    });
  } catch (error) {
    console.error("Create recipe error:", error);

    return res.status(500).json({
      message: "Failed to create recipe.",
    });
  }
};

// ===============================
// GET RECIPE BY ID
// SUPPORTS:
// - Archive UUID in `id`
// - MongoDB ObjectId
// ===============================
const getRecipeById = async (req, res) => {
  try {
    const recipeId = req.params.id;

    let recipe = null;

    // Archive recipes use the custom `id` field.
    recipe = await Recipe.findOne({
      id: recipeId,
      recipeType: "archive",
    }).populate("createdBy", "name email chef");

    // Community recipes use MongoDB _id.
    if (!recipe && mongoose.Types.ObjectId.isValid(recipeId)) {
      recipe = await Recipe.findOne({
        _id: recipeId,
        recipeType: "community",
      }).populate("createdBy", "name email chef");
    }

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    let userRating = 0;

    if (req.userId && Array.isArray(recipe.ratings)) {
      const existingRating = recipe.ratings.find(
        (rating) => String(rating.user) === String(req.userId),
      );

      if (existingRating) {
        userRating = existingRating.value;
      }
    }

    return res.status(200).json({
      recipe,
      userRating,
    });
  } catch (error) {
    console.error("Get recipe error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipe.",
    });
  }
};

// ===============================
// RATE RECIPE
// ===============================
const rateRecipe = async (req, res) => {
  try {
    const { value } = req.body;
    const ratingValue = Number(value);

    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (recipe.recipeType !== "community") {
      return res.status(400).json({
        message: "Only community recipes can be rated.",
      });
    }

    if (recipe.createdBy && String(recipe.createdBy) === String(req.userId)) {
      return res.status(403).json({
        message: "You cannot rate your own recipe.",
      });
    }

    if (!Array.isArray(recipe.ratings)) {
      recipe.ratings = [];
    }

    const existingRating = recipe.ratings.find(
      (rating) => String(rating.user) === String(req.userId),
    );

    if (existingRating) {
      existingRating.value = ratingValue;
    } else {
      recipe.ratings.push({
        user: req.userId,
        value: ratingValue,
      });
    }

    const totalRating = recipe.ratings.reduce(
      (sum, rating) => sum + Number(rating.value),
      0,
    );

    const ratingCount = recipe.ratings.length;

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    recipe.averageRating = Number(averageRating.toFixed(1));

    recipe.ratingCount = ratingCount;

    recipe.rating = recipe.averageRating;
    recipe.voteCount = ratingCount;

    await recipe.save();

    return res.status(200).json({
      message: existingRating
        ? "Rating updated successfully."
        : "Rating added successfully.",

      averageRating: recipe.averageRating,
      ratingCount: recipe.ratingCount,
      rating: recipe.rating,
      voteCount: recipe.voteCount,
      userRating: ratingValue,
    });
  } catch (error) {
    console.error("Rate recipe error:", error);

    return res.status(500).json({
      message: "Failed to save rating.",
    });
  }
};

// ===============================
// UPDATE RECIPE
// ===============================
const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (recipe.recipeType !== "community") {
      return res.status(403).json({
        message: "Archive recipes cannot be edited.",
      });
    }

    if (!recipe.createdBy || String(recipe.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message: "You can only edit your own recipe.",
      });
    }

    const {
      name,
      description,
      ingredients,
      steps,
      nutrients,
      prepTime,
      cookTime,
      serves,
      servings,
      difficulty,
      subcategory,
      dishType,
      mainCategory,
      category,
      images,
    } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          message: "Recipe name is required.",
        });
      }

      recipe.name = String(name).trim();
    }

    if (description !== undefined) {
      recipe.description = String(description).trim();
    }

    if (ingredients !== undefined) {
      recipe.ingredients = Array.isArray(ingredients)
        ? ingredients.filter((item) => String(item).trim())
        : [];
    }

    if (steps !== undefined) {
      recipe.steps = Array.isArray(steps)
        ? steps.filter((item) => String(item).trim())
        : [];
    }

    if (nutrients !== undefined) {
      recipe.nutrients = nutrients || {};
    }

    if (prepTime !== undefined) {
      recipe.prepTime = String(prepTime || "").trim();

      recipe.times.preparation = recipe.prepTime;
    }

    if (cookTime !== undefined) {
      recipe.cookTime = String(cookTime || "").trim();

      recipe.times.cooking = recipe.cookTime;
    }

    if (servings !== undefined || serves !== undefined) {
      const parsedServings = Number(servings ?? serves ?? 0);

      recipe.servings = parsedServings;
      recipe.serves = parsedServings;
    }

    if (difficulty !== undefined) {
      recipe.difficulty = String(difficulty || "").trim();
    }

    if (subcategory !== undefined) {
      recipe.subcategory = String(subcategory || "").trim();
    }

    if (dishType !== undefined) {
      recipe.dishType = String(dishType || "").trim();
    }

    if (mainCategory !== undefined) {
      recipe.mainCategory = String(mainCategory || "").trim();
    }

    if (category !== undefined) {
      recipe.category = String(category || "").trim();
    }

    if (images !== undefined) {
      const parsedImages = Array.isArray(images)
        ? images.filter((image) => String(image).trim())
        : [];

      if (parsedImages.length > 6) {
        return res.status(400).json({
          message: "You can upload maximum 6 images.",
        });
      }

      recipe.images = parsedImages;
      recipe.image = parsedImages[0] || "";
    }

    await recipe.save();

    const updatedRecipe = await Recipe.findById(recipe._id).populate(
      "createdBy",
      "name email chef",
    );

    return res.status(200).json({
      message: "Recipe updated successfully.",
      recipe: updatedRecipe,
    });
  } catch (error) {
    console.error("Update recipe error:", error);

    return res.status(500).json({
      message: "Failed to update recipe.",
    });
  }
};

// ===============================
// DELETE RECIPE
// ===============================
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (recipe.recipeType !== "community") {
      return res.status(403).json({
        message: "Archive recipes cannot be deleted.",
      });
    }

    if (!recipe.createdBy || String(recipe.createdBy) !== String(req.userId)) {
      return res.status(403).json({
        message: "You can only delete your own recipe.",
      });
    }

    await Recipe.findByIdAndDelete(recipe._id);

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

// ===============================
// GET MY RECIPES
// ===============================
const getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      recipeType: "community",
      createdBy: req.userId,
    })
      .populate("createdBy", "name email chef")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      recipes,
    });
  } catch (error) {
    console.error("Get my recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch my recipes.",
    });
  }
};

// ===============================
// GET ALL USER RECIPES
// ===============================
const getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      recipeType: "community",
    })
      .populate("createdBy", "name email chef")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      recipes,
    });
  } catch (error) {
    console.error("Get user recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch user recipes.",
    });
  }
};

// ===============================
// EXPORTS
// ===============================
module.exports = {
  uploadRecipeImages,
  getRecipes,
  getFilterOptions,
  createRecipe,
  getRecipeById,
  rateRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
  getUserRecipes,
};
