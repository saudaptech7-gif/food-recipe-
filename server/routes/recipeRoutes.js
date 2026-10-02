/* eslint-disable no-undef */
const express = require("express");
const Recipe = require("../models/Recipe");

const router = express.Router();

router.get("/filters/options", async (req, res) => {
  try {
    const difficulties = await Recipe.distinct("difficulty");
    const subcategories = await Recipe.distinct("subcategory");
    const dishTypes = await Recipe.distinct("dishType");

    res.json({
      difficulties: difficulties.filter(Boolean).sort(),
      subcategories: subcategories.filter(Boolean).sort(),
      dishTypes: dishTypes.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch filter options",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      difficulty,
      subcategory,
      dishType,
      page = 1,
      limit = 9,
    } = req.query;

    const filter = {};

    if (category) {
      filter.mainCategory = category;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (dishType) {
      filter.dishType = dishType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const recipes = await Recipe.find(filter).skip(skip).limit(Number(limit));

    const totalRecipes = await Recipe.countDocuments(filter);

    res.json({
      recipes,
      currentPage: Number(page),
      totalPages: Math.ceil(totalRecipes / Number(limit)),
      totalRecipes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch recipes",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      id: req.params.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch recipe",
      error
    });
  }
});

module.exports = router;
