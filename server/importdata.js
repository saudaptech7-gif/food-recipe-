/* eslint-disable no-undef */

const dotenv = require("dotenv");

dotenv.config();

const mongoose = require("mongoose");

const Recipe = require("./models/Recipe");

const recipes = require("./data/recipes.json");

const importData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // =================================
    // NORMALIZE ARCHIVE DATA
    // =================================

    const normalizedRecipes = recipes.map((recipe) => {
      const preparation =
        recipe.times?.Preparation || recipe.times?.preparation || "";

      const cooking = recipe.times?.Cooking || recipe.times?.cooking || "";

      return {
        id: recipe.id,

        url: recipe.url || "",

        image: recipe.image || "",

        name: recipe.name || "",

        description: recipe.description || "",

        author: recipe.author || "",

        // Old archive rating
        rating: Number(recipe.rattings ?? recipe.rating ?? 0),

        // Old archive votes
        voteCount: Number(recipe.vote_count ?? recipe.voteCount ?? 0),

        ingredients: Array.isArray(recipe.ingredients)
          ? recipe.ingredients
          : [],

        steps: Array.isArray(recipe.steps) ? recipe.steps : [],

        nutrients: recipe.nutrients || {},

        times: {
          preparation,
          cooking,
        },

        serves: Number(recipe.serves || 0),

        // Normalize old names
        difficulty: recipe.difficult || recipe.difficulty || "",

        subcategory: recipe.subcategory || "",

        dishType: recipe.dish_type || recipe.dishType || "",

        mainCategory: recipe.maincategory || recipe.mainCategory || "",

        category: recipe.maincategory || recipe.category || "",

        // =================================
        // ARCHIVE DEFAULTS
        // =================================

        recipeType: "archive",

        createdBy: null,

        images: [],

        ratings: [],

        averageRating: 0,

        ratingCount: 0,
      };
    });

    // =================================
    // CLEAR OLD ARCHIVE DATA
    // =================================

    await Recipe.deleteMany({
      recipeType: "archive",
    });

    // =================================
    // IMPORT
    // =================================

    await Recipe.insertMany(normalizedRecipes);

    console.log(
      `${normalizedRecipes.length} archive recipes imported successfully`,
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Import failed:", error);

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
};

importData();
