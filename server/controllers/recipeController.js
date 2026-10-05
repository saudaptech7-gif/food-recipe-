/* eslint-disable no-undef */
const cloudinary = require("../config/cloudinary");
const Recipe = require("../models/Recipe");

// =========================
// Upload Images to Cloudinary
// =========================

const uploadRecipeImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one image",
      });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "foodrecipe/recipes",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          },
        );

        uploadStream.end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    return res.status(200).json({
      message: "Images uploaded successfully",
      images: imageUrls,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    return res.status(500).json({
      message: "Failed to upload images",
    });
  }
};

// =========================
// Create Community Recipe
// =========================

const createRecipe = async (req, res) => {
  try {
    const {
      name,
      description,
      ingredients,
      steps,
      category,
      difficulty,
      prepTime,
      cookTime,
      servings,
      images,
    } = req.body;

    // Required fields
    if (
      !name ||
      !description ||
      !ingredients ||
      !steps ||
      !category ||
      !difficulty ||
      !prepTime ||
      !cookTime ||
      !servings
    ) {
      return res.status(400).json({
        message: "Please fill all required recipe fields",
      });
    }

    // Check images
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one recipe image",
      });
    }

    if (images.length > 6) {
      return res.status(400).json({
        message: "A recipe can have maximum 6 images",
      });
    }

    // Create recipe
    const recipe = await Recipe.create({
      name: name.trim(),

      description: description.trim(),

      ingredients: Array.isArray(ingredients)
        ? ingredients
        : JSON.parse(ingredients),

      steps: Array.isArray(steps) ? steps : JSON.parse(steps),

      category: category.trim(),

      difficulty: difficulty.trim(),

      prepTime: prepTime.trim(),

      cookTime: cookTime.trim(),

      serves: Number(servings),

      images,

      recipeType: "community",

      createdBy: req.userId,

      ratings: [],

      averageRating: 0,

      ratingCount: 0,
    });

    return res.status(201).json({
      message: "Recipe created successfully",

      recipe,
    });
  } catch (error) {
    console.error("Create recipe error:", error);

    return res.status(500).json({
      message: "Failed to create recipe",
    });
  }
};

module.exports = {
  uploadRecipeImages,
  createRecipe,
};
