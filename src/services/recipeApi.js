import { apiFetch } from "./apiFetch";

const API_URL = `${import.meta.env.VITE_API_URL}/api/recipes`;

// =====================================
// GET ARCHIVE / COMMUNITY RECIPES
// =====================================

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

  if (category.trim()) {
    params.append("category", category.trim());
  }

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (difficulty.trim()) {
    params.append("difficulty", difficulty.trim());
  }

  if (subcategory.trim()) {
    params.append("subcategory", subcategory.trim());
  }

  if (dishType.trim()) {
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

  return {
    recipes: Array.isArray(data.recipes) ? data.recipes : [],

    currentPage: data.currentPage || page,

    totalPages: data.totalPages || 1,

    totalRecipes: data.totalRecipes || 0,
  };
};

// =====================================
// SINGLE RECIPE
// =====================================

export const getRecipeById = async (id) => {
  const response = await apiFetch(`${API_URL}/${id}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch recipe");
  }

  return data;
};

// =====================================
// FILTER OPTIONS
// =====================================

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

// =====================================
// CLOUDINARY UPLOAD
// =====================================

export const uploadRecipeImages = async (images) => {
  const formData = new FormData();

  images.forEach((image) => {
    formData.append("images", image);
  });

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

// =====================================
// CREATE
// =====================================

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

// =====================================
// UPDATE
// =====================================

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

// =====================================
// MY RECIPES
// =====================================

export const getMyRecipes = async () => {
  const response = await apiFetch(`${API_URL}/my`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch my recipes");
  }

  return Array.isArray(data)
    ? data
    : Array.isArray(data.recipes)
      ? data.recipes
      : [];
};

// =====================================
// USER RECIPES
// ALL COMMUNITY RECIPES
// =====================================

export const getUserRecipes = async () => {
  const response = await apiFetch(`${API_URL}/community`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user recipes");
  }

  return Array.isArray(data)
    ? data
    : Array.isArray(data.recipes)
      ? data.recipes
      : [];
};

// =====================================
// RATING
// =====================================

export const rateRecipe = async (id, value) => {
  const response = await apiFetch(`${API_URL}/${id}/rating`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      value,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to save rating");
  }

  return data;
};

// =====================================
// DELETE
// =====================================

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
