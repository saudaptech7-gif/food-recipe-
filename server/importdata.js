/* eslint-disable no-undef */
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Recipe = require("./models/Recipe");
const recipes = require("./data/recipes.json");

dotenv.config();

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const normalizedRecipes = recipes.map((recipe) => ({
      id: recipe.id,
      url: recipe.url,
      image: recipe.image,
      name: recipe.name,
      description: recipe.description,
      author: recipe.author,

      rating: recipe.rattings,
      voteCount: recipe.vote_count,

      ingredients: recipe.ingredients,
      steps: recipe.steps,

      nutrients: recipe.nutrients || {},

      times: {
        preparation: recipe.times?.Preparation || "",
        cooking: recipe.times?.Cooking || "",
      },

      serves: recipe.serves,
      difficulty: recipe.difficult,

      subcategory: recipe.subcategory,
      dishType: recipe.dish_type,
      mainCategory: recipe.maincategory,
    }));

    await Recipe.deleteMany();

    await Recipe.insertMany(normalizedRecipes);

    console.log("Recipes imported successfully");

    process.exit();
  } catch (error) {
    console.error("Import failed:", error.message);
    process.exit(1);
  }
};

importData();