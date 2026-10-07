/* eslint-disable no-undef */

const express = require("express");

const mongoose = require("mongoose");

const User = require("../models/User");

const Recipe = require("../models/Recipe");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================
// GET FAVORITES
// =====================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.favorites.length === 0) {
      return res.status(200).json({
        favorites: [],
      });
    }

    const objectIds = user.favorites.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    const archiveIds = user.favorites.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    const query = {
      $or: [],
    };

    if (archiveIds.length > 0) {
      query.$or.push({
        id: {
          $in: archiveIds,
        },
      });
    }

    if (objectIds.length > 0) {
      query.$or.push({
        _id: {
          $in: objectIds,
        },
      });
    }

    const recipes =
      query.$or.length > 0
        ? await Recipe.find(query).populate("createdBy", "name chef")
        : [];

    return res.status(200).json({
      favorites: recipes,
    });
  } catch (error) {
    console.error("Get favorites error:", error);

    return res.status(500).json({
      message: "Failed to fetch favorites",
    });
  }
});

// =====================================
// ADD FAVORITE
// =====================================

router.post("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;

    let recipe = null;

    // Archive recipe
    recipe = await Recipe.findOne({
      id: recipeId,
    });

    // Community recipe
    if (!recipe && mongoose.Types.ObjectId.isValid(recipeId)) {
      recipe = await Recipe.findById(recipeId);
    }

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const favoriteId = recipe.id || recipe._id.toString();

    if (!user.favorites.includes(favoriteId)) {
      user.favorites.push(favoriteId);

      await user.save();
    }

    return res.status(200).json({
      message: "Recipe added to favorites",

      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    return res.status(500).json({
      message: "Failed to add favorite",
    });
  }
});

// =====================================
// REMOVE FAVORITE
// =====================================

router.delete("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.favorites = user.favorites.filter((id) => id !== recipeId);

    await user.save();

    return res.status(200).json({
      message: "Recipe removed from favorites",

      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    return res.status(500).json({
      message: "Failed to remove favorite",
    });
  }
});

module.exports = router;
