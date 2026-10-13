
/* eslint-disable no-undef */

const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const Recipe = require("../models/Recipe");

// =====================================
// AUTHENTICATION HELPERS
// =====================================

const getAuthenticatedUserId = (req) => {
  const user =
    req.userId ||
    req.user?._id ||
    req.user?.id ||
    req.user?.userId;

  if (!user) return null;

  return user._id || user.id || user;
};

const requireUser = (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      message: "Not authenticated",
    });

    return null;
  }

  return userId;
};

const idString = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    value = value._id || value.id || value.userId;
  }

  return value ? String(value) : "";
};

const isOwner = (recipe, userId) =>
  Boolean(
    recipe?.createdBy &&
      userId &&
      idString(recipe.createdBy) === idString(userId),
  );

// =====================================
// PUBLISH STATUS HELPERS
// =====================================

const getPublishField = (recipe = null) => {
  const fields = ["isPublished", "published", "is_published"];

  for (const field of fields) {
    if (Recipe.schema.path(field)) {
      return field;
    }
  }

  if (recipe) {
    for (const field of fields) {
      if (recipe[field] !== undefined) {
        return field;
      }
    }
  }

  return "isPublished";
};

const isPublished = (recipe) => {
  if (!recipe) return false;

  const fields = [
    "isPublished",
    "published",
    "is_published",
    "publishStatus",
    "status",
  ];

  for (const field of fields) {
    const value = recipe[field];

    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string") {
      return [
        "published",
        "public",
        "true",
        "1",
      ].includes(value.trim().toLowerCase());
    }

    return value === true || value === 1;
  }

  // Old records without publish information remain visible.
  return true;
};

// =====================================
// RECIPE HELPERS
// =====================================

const findRecipeById = async (id) => {
  if (!id) return null;

  if (mongoose.Types.ObjectId.isValid(String(id))) {
    const recipe = await Recipe.findById(id);

    if (recipe) return recipe;
  }

  return Recipe.findOne({
    id: String(id),
  });
};

const parseArray = (value, fieldName) => {
  let result = value;

  if (typeof result === "string") {
    try {
      result = JSON.parse(result);
    } catch {
      throw new Error(`Invalid ${fieldName} format`);
    }
  }

  if (!Array.isArray(result)) {
    throw new Error(`${fieldName} must be an array`);
  }

  return result
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

const parseNutrients = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  let nutrients = value;

  if (typeof nutrients === "string") {
    try {
      nutrients = JSON.parse(nutrients);
    } catch {
      throw new Error("Invalid nutrients format");
    }
  }

  if (
    typeof nutrients !== "object" ||
    Array.isArray(nutrients)
  ) {
    throw new Error("Nutrients must be an object");
  }

  const fields = [
    "kcal",
    "fat",
    "saturates",
    "carbs",
    "sugars",
    "fibre",
    "protein",
    "salt",
  ];

  const result = {};

  for (const field of fields) {
    const fieldValue = nutrients[field];

    result[field] =
      fieldValue === undefined || fieldValue === null
        ? ""
        : String(fieldValue).trim();
  }

  return result;
};

// =====================================
// FILTER HELPERS
// =====================================

const categoryAliases = (category) => {
  const normalized = String(category || "")
    .trim()
    .toLowerCase();

  const aliases = {
    baking: ["baking"],
    budget: ["budget", "budgets"],
    budgets: ["budget", "budgets"],
    recipes: ["recipes"],
    inspiration: ["inspiration"],
    health: ["health"],
  };

  return aliases[normalized] || [normalized];
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactRegex = (value) =>
  new RegExp(
    `^\\s*${escapeRegex(String(value ?? "").trim())}\\s*$`,
    "i",
  );

const containsRegex = (value) =>
  new RegExp(
    escapeRegex(String(value ?? "").trim()),
    "i",
  );

// Support older archive records without recipeType.
const getArchiveQuery = () => ({
  $or: [
    { recipeType: "archive" },
    { recipeType: { $exists: false } },
    { recipeType: null },
    { recipeType: "" },
  ],
});

const getCategoryQuery = (category) => {
  const aliases = categoryAliases(category);

  const pattern = new RegExp(
    `^\\s*(?:${aliases.map(escapeRegex).join("|")})\\s*$`,
    "i",
  );

  return {
    $or: [
      { mainCategory: pattern },
      { maincategory: pattern },
      { category: pattern },
      { subcategory: pattern },
      { subCategory: pattern },
    ],
  };
};

// Supports difficulty and legacy difficult fields.
// Comparison also ignores uppercase and surrounding spaces.
const getDifficultyQuery = (difficulty) => {
  const normalized = String(difficulty ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) return {};

  const pattern = exactRegex(normalized);

  const normalizedFieldMatch = (field) => ({
    $expr: {
      $eq: [
        {
          $toLower: {
            $trim: {
              input: {
                $convert: {
                  input: `$${field}`,
                  to: "string",
                  onError: "",
                  onNull: "",
                },
              },
            },
          },
        },
        normalized,
      ],
    },
  });

  return {
    $or: [
      { difficulty: pattern },
      { difficult: pattern },
      normalizedFieldMatch("difficulty"),
      normalizedFieldMatch("difficult"),
    ],
  };
};

const getSubcategoryQuery = (subcategory) => {
  const pattern = exactRegex(subcategory);

  return {
    $or: [
      { subcategory: pattern },
      { subCategory: pattern },
    ],
  };
};

const getDishTypeQuery = (dishType) => {
  const pattern = exactRegex(dishType);

  return {
    $or: [
      { dishType: pattern },
      { dish_type: pattern },
    ],
  };
};

const getSearchQuery = (search) => {
  const pattern = containsRegex(search);

  return {
    $or: [
      { name: pattern },
      { description: pattern },
      { ingredients: pattern },
      { mainCategory: pattern },
      { maincategory: pattern },
      { category: pattern },
      { subcategory: pattern },
      { subCategory: pattern },
      { dishType: pattern },
      { dish_type: pattern },
    ],
  };
};

// =====================================
// ARCHIVE NUTRITION QUERY
// =====================================

const getNutritionQuery = () => {
  const roots = [
    "nutrients",
    "nutrition",
    "nutritionalInfo",
  ];

  const nutrientKeys = [
    "kcal",
    "fat",
    "saturates",
    "carbs",
    "sugars",
    "fibre",
    "protein",
    "salt",
  ];

  const conditions = [];

  for (const root of roots) {
    for (const key of nutrientKeys) {
      conditions.push({
        [`${root}.${key}`]: {
          $exists: true,
          $nin: [null, ""],
        },
      });
    }
  }

  return {
    $or: conditions,
  };
};

// =====================================
// BUILD RECIPE QUERY
// =====================================

const buildRecipeQuery = (req) => {
  const recipeType = String(
    req.query.recipeType || req.query.type || "archive",
  )
    .trim()
    .toLowerCase();

  const conditions = [];

  if (recipeType === "community") {
    conditions.push({
      recipeType: "community",
    });
  } else if (recipeType !== "all") {
    conditions.push(getArchiveQuery());
    conditions.push(getNutritionQuery());
  }

  const category = String(req.query.category || "").trim();
  const search = String(req.query.search || "").trim();
  const difficulty = String(req.query.difficulty || "").trim();
  const subcategory = String(req.query.subcategory || "").trim();

  const dishType = String(
    req.query.dishType || req.query.dish_type || "",
  ).trim();

  if (category) {
    conditions.push(getCategoryQuery(category));
  }

  if (difficulty) {
    conditions.push(getDifficultyQuery(difficulty));
  }

  if (subcategory) {
    conditions.push(getSubcategoryQuery(subcategory));
  }

  if (dishType) {
    conditions.push(getDishTypeQuery(dishType));
  }

  if (search) {
    conditions.push(getSearchQuery(search));
  }

  return {
    recipeType,
    query: conditions.length
      ? { $and: conditions }
      : {},
  };
};

// =====================================
// GET FILTER OPTIONS
// GET /api/recipes/filters/options
// =====================================

const getFilterOptions = async (req, res) => {
  try {
    const eligibleArchiveQuery = {
      $and: [
        getArchiveQuery(),
        getNutritionQuery(),
      ],
    };

    const distinct = (field) =>
      Recipe.collection.distinct(
        field,
        eligibleArchiveQuery,
      );

    const [
      mainCategories,
      oldMainCategories,
      categories,
      difficulties,
      oldDifficulties,
      subcategories,
      oldSubcategories,
      dishTypes,
      oldDishTypes,
    ] = await Promise.all([
      distinct("mainCategory"),
      distinct("maincategory"),
      distinct("category"),
      distinct("difficulty"),
      distinct("difficult"),
      distinct("subcategory"),
      distinct("subCategory"),
      distinct("dishType"),
      distinct("dish_type"),
    ]);

    const uniqueValues = (values) => {
      const normalizedValues = new Map();

      for (const value of values) {
        if (
          value === null ||
          value === undefined ||
          String(value).trim() === ""
        ) {
          continue;
        }

        const cleanValue = String(value).trim();
        const key = cleanValue.toLowerCase();

        if (!normalizedValues.has(key)) {
          normalizedValues.set(key, cleanValue);
        }
      }

      return [...normalizedValues.values()].sort(
        (a, b) => a.localeCompare(b),
      );
    };

    return res.status(200).json({
      categories: uniqueValues([
        ...mainCategories,
        ...oldMainCategories,
        ...categories,
      ]),

      difficulties: uniqueValues([
        ...difficulties,
        ...oldDifficulties,
      ]),

      subcategories: uniqueValues([
        ...subcategories,
        ...oldSubcategories,
      ]),

      dishTypes: uniqueValues([
        ...dishTypes,
        ...oldDishTypes,
      ]),
    });
  } catch (error) {
    console.error("Get filter options error:", error);

    return res.status(500).json({
      message: "Failed to load filter options",
    });
  }
};

// =====================================
// GET RECIPES
// GET /api/recipes
// =====================================

const getRecipes = async (req, res) => {
  try {
    const { recipeType, query } = buildRecipeQuery(req);

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 9,
      ),
    );

    const skip = (page - 1) * limit;

    if (recipeType === "community") {
      const allMatchingRecipes = await Recipe.find(query)
        .setOptions({ strictQuery: false })
        .populate("createdBy", "name chef")
        .sort({ createdAt: -1, _id: -1 })
        .lean();

      const publishedRecipes =
        allMatchingRecipes.filter(isPublished);

      const totalRecipes = publishedRecipes.length;
      const totalPages = Math.max(
        1,
        Math.ceil(totalRecipes / limit),
      );

      return res.status(200).json({
        recipes: publishedRecipes.slice(skip, skip + limit),
        currentPage: page,
        totalPages,
        totalRecipes,
      });
    }

    const [totalRecipes, recipes] = await Promise.all([
      Recipe.countDocuments(query)
        .setOptions({ strictQuery: false })
        .exec(),

      Recipe.find(query)
        .setOptions({ strictQuery: false })
        .populate("createdBy", "name chef")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const totalPages = Math.max(
      1,
      Math.ceil(totalRecipes / limit),
    );

    return res.status(200).json({
      recipes,
      currentPage: page,
      totalPages,
      totalRecipes,
    });
  } catch (error) {
    console.error("Get recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipes",
    });
  }
};

// =====================================
// UPLOAD RECIPE IMAGES
// POST /api/recipes/upload-images
// =====================================

const uploadRecipeImages = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one image",
      });
    }

    if (req.files.length > 6) {
      return res.status(400).json({
        message: "You can upload maximum 6 images",
      });
    }

    const uploadPromises = req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "foodrecipe/recipes",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              resolve(result.secure_url);
            },
          );

          stream.end(file.buffer);
        }),
    );

    const images = await Promise.all(uploadPromises);

    return res.status(200).json({
      message: "Images uploaded successfully",
      images,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    return res.status(500).json({
      message: "Failed to upload images",
    });
  }
};

// =====================================
// CREATE COMMUNITY RECIPE
// POST /api/recipes
// =====================================

const createRecipe = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

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
      nutrients,
    } = req.body;

    if (
      !name?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !difficulty?.trim() ||
      !String(prepTime ?? "").trim() ||
      !String(cookTime ?? "").trim() ||
      !String(servings ?? "").trim()
    ) {
      return res.status(400).json({
        message: "Please fill all required recipe fields",
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one recipe image",
      });
    }

    if (images.length > 6) {
      return res.status(400).json({
        message: "A recipe can have maximum 6 images",
      });
    }

    const cleanIngredients = parseArray(
      ingredients,
      "ingredients",
    );

    const cleanSteps = parseArray(steps, "steps");

    if (cleanIngredients.length === 0) {
      return res.status(400).json({
        message: "Please add at least one ingredient",
      });
    }

    if (cleanSteps.length === 0) {
      return res.status(400).json({
        message: "Please add at least one cooking step",
      });
    }

    const servingsNumber = Number(servings);

    if (!Number.isFinite(servingsNumber) || servingsNumber <= 0) {
      return res.status(400).json({
        message: "Servings must be a valid number",
      });
    }

    const cleanNutrients = parseNutrients(nutrients);
    const publishField = getPublishField();

    const recipeData = {
      name: name.trim(),
      description: description.trim(),
      ingredients: cleanIngredients,
      steps: cleanSteps,
      category: category.trim(),
      mainCategory: category.trim(),
      difficulty: difficulty.trim(),
      prepTime: String(prepTime).trim(),
      cookTime: String(cookTime).trim(),
      servings: servingsNumber,
      serves: servingsNumber,
      images,
      recipeType: "community",
      createdBy: userId,
      ratings: [],
      averageRating: 0,
      ratingCount: 0,
      [publishField]: false,
    };

    if (cleanNutrients !== undefined) {
      recipeData.nutrients = cleanNutrients;
    }

    const recipe = await Recipe.create(recipeData);

    // Ensure newly created recipes remain drafts.
    await Recipe.collection.updateOne(
      { _id: recipe._id },
      {
        $set: {
          [publishField]: false,
        },
      },
    );

    await recipe.populate("createdBy", "name chef");

    const responseRecipe = recipe.toObject();
    responseRecipe[publishField] = false;

    return res.status(201).json({
      message: "Recipe created successfully",
      recipe: responseRecipe,
    });
  } catch (error) {
    console.error("Create recipe error:", error);

    return res.status(500).json({
      message: "Failed to create recipe",
    });
  }
};

// =====================================
// GET SINGLE RECIPE
// GET /api/recipes/:id
// =====================================

const getRecipeById = async (req, res) => {
  try {
    const recipe = await findRecipeById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    await recipe.populate("createdBy", "name chef");

    return res.status(200).json(recipe);
  } catch (error) {
    console.error("Get recipe error:", error);

    return res.status(500).json({
      message: "Failed to fetch recipe",
    });
  }
};

// =====================================
// RATE COMMUNITY RECIPE
// POST /api/recipes/:id/rating
// =====================================

const rateRecipe = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const rawValue =
      typeof req.body === "number"
        ? req.body
        : req.body?.value ??
          req.body?.rating ??
          req.body?.stars ??
          req.body?.ratingValue;

    const ratingValue = Number(rawValue);

    if (
      rawValue === undefined ||
      rawValue === null ||
      String(rawValue).trim() === "" ||
      !Number.isInteger(ratingValue) ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5 stars",
      });
    }

    const recipe = await findRecipeById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    if (recipe.recipeType !== "community") {
      return res.status(403).json({
        message: "Archive recipes cannot be rated",
      });
    }

    if (isOwner(recipe, userId)) {
      return res.status(403).json({
        message: "You cannot rate your own recipe",
      });
    }

    if (!Array.isArray(recipe.ratings)) {
      recipe.ratings = [];
    }

    const existingRating = recipe.ratings.find(
      (item) => idString(item.user) === idString(userId),
    );

    if (existingRating) {
      existingRating.value = ratingValue;
    } else {
      recipe.ratings.push({
        user: userId,
        value: ratingValue,
      });
    }

    const total = recipe.ratings.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0,
    );

    const count = recipe.ratings.length;

    const average =
      count > 0
        ? Number((total / count).toFixed(1))
        : 0;

    recipe.averageRating = average;
    recipe.ratingCount = count;

    // Keep older UI fields synchronized.
    recipe.rating = average;
    recipe.voteCount = count;

    await recipe.save();

    return res.status(200).json({
      message: existingRating
        ? "Rating updated successfully"
        : "Rating submitted successfully",
      averageRating: average,
      ratingCount: count,
      rating: average,
      voteCount: count,
      userRating: ratingValue,
    });
  } catch (error) {
    console.error("Rate recipe error:", error);

    return res.status(500).json({
      message: "Failed to rate recipe",
    });
  }
};

// =====================================
// UPDATE OWN COMMUNITY RECIPE
// PUT /api/recipes/:id
// =====================================

const updateRecipe = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const recipe = await findRecipeById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    if (recipe.recipeType !== "community") {
      return res.status(403).json({
        message: "Archive recipes cannot be edited",
      });
    }

    if (!isOwner(recipe, userId)) {
      return res.status(403).json({
        message: "You can only edit your own recipes",
      });
    }

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
      nutrients,
    } = req.body;

    if (
      !name?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !difficulty?.trim() ||
      !String(prepTime ?? "").trim() ||
      !String(cookTime ?? "").trim() ||
      !String(servings ?? "").trim()
    ) {
      return res.status(400).json({
        message: "Please fill all required recipe fields",
      });
    }

    const cleanIngredients = parseArray(
      ingredients,
      "ingredients",
    );

    const cleanSteps = parseArray(steps, "steps");

    if (cleanIngredients.length === 0 || cleanSteps.length === 0) {
      return res.status(400).json({
        message: "Please add ingredients and cooking steps",
      });
    }

    const servingsNumber = Number(servings);

    if (!Number.isFinite(servingsNumber) || servingsNumber <= 0) {
      return res.status(400).json({
        message: "Servings must be a valid number",
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "At least one recipe image is required",
      });
    }

    if (images.length > 6) {
      return res.status(400).json({
        message: "A recipe can have maximum 6 images",
      });
    }

    recipe.name = name.trim();
    recipe.description = description.trim();
    recipe.ingredients = cleanIngredients;
    recipe.steps = cleanSteps;
    recipe.category = category.trim();
    recipe.mainCategory = category.trim();
    recipe.difficulty = difficulty.trim();
    recipe.prepTime = String(prepTime).trim();
    recipe.cookTime = String(cookTime).trim();
    recipe.servings = servingsNumber;
    recipe.serves = servingsNumber;
    recipe.images = images;

    const cleanNutrients = parseNutrients(nutrients);

    if (cleanNutrients !== undefined) {
      recipe.nutrients = cleanNutrients;
    }

    await recipe.save();
    await recipe.populate("createdBy", "name chef");

    return res.status(200).json({
      message: "Recipe updated successfully",
      recipe,
    });
  } catch (error) {
    console.error("Update recipe error:", error);

    return res.status(500).json({
      message: "Failed to update recipe",
    });
  }
};

// =====================================
// PUBLISH / UNPUBLISH OWN RECIPE
// PATCH /api/recipes/:id/publish
// =====================================

const togglePublishRecipe = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const recipe = await findRecipeById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    if (recipe.recipeType !== "community") {
      return res.status(403).json({
        message: "Only community recipes can be published",
      });
    }

    if (!isOwner(recipe, userId)) {
      return res.status(403).json({
        message: "You can only publish your own recipes",
      });
    }

    const rawRecipe = await Recipe.collection.findOne({
      _id: recipe._id,
    });

    if (!rawRecipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    const publishField = getPublishField(rawRecipe);
    const nextStatus = !isPublished(rawRecipe);

    await Recipe.collection.updateOne(
      { _id: recipe._id },
      {
        $set: {
          [publishField]: nextStatus,
        },
      },
    );

    const updatedRecipe = await Recipe.findById(recipe._id)
      .populate("createdBy", "name chef")
      .lean();

    return res.status(200).json({
      message: nextStatus
        ? "Recipe published successfully"
        : "Recipe unpublished successfully",
      isPublished: nextStatus,
      published: nextStatus,
      recipe: {
        ...updatedRecipe,
        [publishField]: nextStatus,
      },
    });
  } catch (error) {
    console.error("Toggle publish recipe error:", error);

    return res.status(500).json({
      message: "Failed to update recipe publish status",
    });
  }
};

// =====================================
// DELETE OWN COMMUNITY RECIPE
// DELETE /api/recipes/:id
// =====================================

const deleteRecipe = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const recipe = await findRecipeById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    if (recipe.recipeType !== "community") {
      return res.status(403).json({
        message: "Archive recipes cannot be deleted",
      });
    }

    if (!isOwner(recipe, userId)) {
      return res.status(403).json({
        message: "You can only delete your own recipes",
      });
    }

    await Recipe.deleteOne({
      _id: recipe._id,
    });

    return res.status(200).json({
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error("Delete recipe error:", error);

    return res.status(500).json({
      message: "Failed to delete recipe",
    });
  }
};

// =====================================
// MY RECIPES
// GET /api/recipes/my
// =====================================

const getMyRecipes = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) return;

    const recipes = await Recipe.find({
      recipeType: "community",
      createdBy: userId,
    })
      .populate("createdBy", "name chef")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(recipes);
  } catch (error) {
    console.error("Get my recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch your recipes",
    });
  }
};

// =====================================
// COMMUNITY RECIPES
// GET /api/recipes/community
// =====================================

const getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      recipeType: "community",
    })
      .populate("createdBy", "name chef")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(
      recipes.filter(isPublished),
    );
  } catch (error) {
    console.error("Get community recipes error:", error);

    return res.status(500).json({
      message: "Failed to fetch community recipes",
    });
  }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================

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
