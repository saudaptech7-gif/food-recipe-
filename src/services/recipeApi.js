const API_URL = `${import.meta.env.VITE_API_URL}/api/recipes`;

// =========================
// GET RECIPES
// =========================

export const getRecipes = async ({
  category = "",
  search = "",
  difficulty = "",
  subcategory = "",
  dishType = "",
  page = 1,
  limit = 9,
} = {}) => {
  const params = new URLSearchParams();

  if (category) {
    params.append("category", category);
  }

  if (search) {
    params.append("search", search);
  }

  if (difficulty) {
    params.append("difficulty", difficulty);
  }

  if (subcategory) {
    params.append("subcategory", subcategory);
  }

  if (dishType) {
    params.append("dishType", dishType);
  }

  params.append("page", page);
  params.append("limit", limit);

  const response = await fetch(`${API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }

  return response.json();
};

// =========================
// GET RECIPE BY ID
// =========================

export const getRecipeById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Recipe not found");
  }

  return response.json();
};

// =========================
// GET FILTER OPTIONS
// =========================

export const getFilterOptions = async () => {
  const response = await fetch(`${API_URL}/filters/options`);

  if (!response.ok) {
    throw new Error("Failed to fetch filter options");
  }

  return response.json();
};

// =========================
// UPLOAD RECIPE IMAGES
// =========================

export const uploadRecipeImages = async (images) => {
  const formData = new FormData();

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await fetch(`${API_URL}/upload-images`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload images");
  }

  return data;
};

// =========================
// CREATE COMMUNITY RECIPE
// =========================

export const createRecipe = async (recipeData) => {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(recipeData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create recipe");
  }

  return data;
};
