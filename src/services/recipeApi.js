import { apiFetch } from "./apiFetch";

const API_URL = `${import.meta.env.VITE_API_URL}/api/recipes`;

// ======================================================
// REMOVE DUPLICATES
// ======================================================

const removeDuplicateRecipes = (recipes = []) => {
  if (!Array.isArray(recipes)) return [];

  const seen = new Set();

  return recipes.filter((recipe) => {
    if (!recipe) return false;

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

// ======================================================
// GET ARCHIVE RECIPES
// ======================================================

export const getRecipes = async ({
  category = "",
  search = "",
  difficulty = "",
  subcategory = "",
  dishType = "",
  recipeType = "archive",
  page = 1,
  limit = 6,
} = {}) => {
  const params = new URLSearchParams();

  if (category?.trim()) {
    params.append("category", category.trim());
  }

  if (search?.trim()) {
    params.append("search", search.trim());
  }

  if (difficulty?.trim()) {
    params.append("difficulty", difficulty.trim());
  }

  if (subcategory?.trim()) {
    params.append("subcategory", subcategory.trim());
  }

  if (dishType?.trim()) {
    params.append("dishType", dishType.trim());
  }

  params.append("recipeType", recipeType);
  params.append("page", String(page));
  params.append("limit", String(limit));

  const response = await apiFetch(`${API_URL}?${params.toString()}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch recipes");
  }

  const recipes = removeDuplicateRecipes(data.recipes || []);

  return {
    recipes,
    currentPage: data.currentPage || page,
    totalPages: data.totalPages || 1,
    totalRecipes: data.totalRecipes || recipes.length,
  };
};

// ======================================================
// GET SINGLE RECIPE
// ======================================================

export const getRecipeById = async (id) => {
  const response = await apiFetch(`${API_URL}/${id}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch recipe");
  }

  return data;
};

// ======================================================
// GET FILTER OPTIONS
// ======================================================

export const getFilterOptions = async () => {
  const response = await apiFetch(`${API_URL}/filters/options`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch filter options");
  }

  return {
    difficulties: Array.isArray(data.difficulties) ? data.difficulties : [],

    subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],

    dishTypes: Array.isArray(data.dishTypes) ? data.dishTypes : [],

    categories: Array.isArray(data.categories) ? data.categories : [],
  };
};

// ======================================================
// UPLOAD RECIPE IMAGES
// ======================================================

export const uploadRecipeImages = async (images) => {
  const formData = new FormData();

  if (Array.isArray(images)) {
    images.forEach((image) => {
      formData.append("images", image);
    });
  }

  const response = await apiFetch(`${API_URL}/upload-images`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload images");
  }

  return data;
};

// ======================================================
// CREATE RECIPE
// ======================================================

export const createRecipe = async (recipeData) => {
  const response = await apiFetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(recipeData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create recipe");
  }

  return data;
};

// ======================================================
// UPDATE RECIPE
// ======================================================

export const updateRecipe = async (id, recipeData) => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(recipeData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update recipe");
  }

  return data;
};

// ======================================================
// GET MY RECIPES
// Published + Unpublished
// ======================================================

export const getMyRecipes = async () => {
  const response = await apiFetch(`${API_URL}/my`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch my recipes");
  }

  const recipes = Array.isArray(data)
    ? data
    : Array.isArray(data.recipes)
      ? data.recipes
      : [];

  return removeDuplicateRecipes(recipes);
};

// ======================================================
// GET COMMUNITY RECIPES
// Only Published Recipes
// ======================================================

export const getUserRecipes = async () => {
  const response = await apiFetch(`${API_URL}/community`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user recipes");
  }

  const recipes = Array.isArray(data)
    ? data
    : Array.isArray(data.recipes)
      ? data.recipes
      : [];

  return removeDuplicateRecipes(recipes);
};

// ======================================================
// PUBLISH / UNPUBLISH RECIPE
// ======================================================

export const togglePublishRecipe = async (id, isPublished) => {
  if (!id) {
    throw new Error("Recipe ID is required.");
  }

  const response = await apiFetch(`${API_URL}/${id}/publish`, {
    method: "PATCH",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      isPublished,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update publish status");
  }

  return data;
};

// ======================================================
// RATE RECIPE
// ======================================================

export const rateRecipe = async (id, value) => {
  const response = await apiFetch(`${API_URL}/${id}/rating`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      rating: value,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to save rating");
  }

  return data;
};

// ======================================================
// DELETE RECIPE
// ======================================================

export const deleteRecipe = async (id) => {
  const response = await apiFetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete recipe");
  }

  return data;
};
