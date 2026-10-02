/* eslint-disable no-undef */
const express = require("express");

const User = require("../models/User");
const Recipe = require("../models/Recipe");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET FAVORITES
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const recipes = await Recipe.find({
      id: { $in: user.favorites },
    });

    res.json({
      favorites: recipes,
    });
  } catch (error) {
    console.error("Get favorites error:", error);

    res.status(500).json({
      message: "Failed to fetch favorites",
    });
  }
});

// ADD FAVORITE
router.post("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findOne({
      id: recipeId,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    const user = await User.findById(req.userId);

    if (!user.favorites.includes(recipeId)) {
      user.favorites.push(recipeId);
      await user.save();
    }

    res.status(200).json({
      message: "Recipe added to favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    res.status(500).json({
      message: "Failed to add favorite",
    });
  }
});

// REMOVE FAVORITE
router.delete("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;

    const user = await User.findById(req.userId);

    user.favorites = user.favorites.filter((id) => id !== recipeId);

    await user.save();

    res.status(200).json({
      message: "Recipe removed from favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(500).json({
      message: "Failed to remove favorite",
    });
  }
});

module.exports = router;
