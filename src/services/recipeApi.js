const API_URL = `${import.meta.env.VITE_API_URL}/api/recipes`;

// =====================================
// GET ALL RECIPES
// =====================================

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch recipes");
  }

  // Backend currently returns an array
  // Make sure frontend always receives an array
  if (Array.isArray(data)) {
    return data;
  }

  // If backend later returns { recipes: [] }
  if (Array.isArray(data.recipes)) {
    return data.recipes;
  }

  return [];
};

// =====================================
// GET RECIPE BY ID
// =====================================

export const getRecipeById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Recipe not found");
  }

  return data;
};

// =====================================
// GET FILTER OPTIONS
// =====================================

export const getFilterOptions = async () => {
  const response = await fetch(`${API_URL}/filters/options`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch filter options");
  }

  return {
    difficulties: Array.isArray(data.difficulties) ? data.difficulties : [],

    subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],

    dishTypes: Array.isArray(data.dishTypes) ? data.dishTypes : [],
  };
};

// =====================================
// UPLOAD RECIPE IMAGES TO CLOUDINARY
// =====================================

export const uploadRecipeImages = async (images) => {
  if (!images || images.length === 0) {
    throw new Error("Please select at least one image");
  }

  if (images.length > 6) {
    throw new Error("You can upload maximum 6 images");
  }

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

  return {
    message: data.message,
    images: Array.isArray(data.images) ? data.images : [],
  };
};

// =====================================
// CREATE COMMUNITY RECIPE
// =====================================

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
