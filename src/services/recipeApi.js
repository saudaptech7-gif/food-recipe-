
/* eslint-disable no-useless-assignment */

import { apiFetch } from "./apiFetch";

// =====================================
// API CONFIGURATION
// =====================================

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE}/api/recipes`;

// Prevent duplicate simultaneous GET requests.
const pendingGetRequests = new Map();

// =====================================
// REQUEST HELPER
// =====================================

async function requestJSON(url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();

  if (method === "GET" && pendingGetRequests.has(url)) {
    return pendingGetRequests.get(url);
  }

  const request = (async () => {
    const response = await apiFetch(url, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed with status ${response.status}`,
      );
    }

    return data;
  })();

  if (method === "GET") {
    pendingGetRequests.set(url, request);
  }

  try {
    return await request;
  } finally {
    if (
      method === "GET" &&
      pendingGetRequests.get(url) === request
    ) {
      pendingGetRequests.delete(url);
    }
  }
}

// =====================================
// JSON REQUEST OPTIONS
// =====================================

const jsonOptions = (method, body) => ({
  method,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

// =====================================
// NORMALIZE RECIPE LIST
// =====================================

function extractRecipeList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.recipes)) {
    return data.recipes;
  }

  if (Array.isArray(data?.data?.recipes)) {
    return data.data.recipes;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

// =====================================
// REMOVE DUPLICATE RECIPES
// =====================================

function removeDuplicateRecipes(recipes) {
  const seen = new Set();

  return recipes.filter((recipe, index) => {
    const identifier =
      recipe?._id ||
      recipe?.id ||
      recipe?.url ||
      `recipe-index-${index}`;

    const key = String(identifier);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

// =====================================
// GET ARCHIVE RECIPES
// GET /api/recipes
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

  const filters = {
    category,
    search,
    difficulty,
    subcategory,
    dishType,
  };

  Object.entries(filters).forEach(([key, value]) => {
    const cleanValue = String(value ?? "").trim();

    if (cleanValue) {
      params.set(key, cleanValue);
    }
  });

  params.set("recipeType", recipeType);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const data = await requestJSON(
    `${API_URL}?${params.toString()}`,
  );

  const recipeList = extractRecipeList(data);
  const recipes = removeDuplicateRecipes(recipeList);

  const metadata = data?.data ?? data;

  return {
    recipes,
    currentPage:
      Number(metadata?.currentPage ?? metadata?.page) ||
      Number(page),

    totalPages:
      Number(metadata?.totalPages ?? metadata?.pages) || 1,

    totalRecipes:
      Number(metadata?.totalRecipes ?? metadata?.total) ||
      recipes.length,
  };
};

// =====================================
// GET FILTER OPTIONS
// GET /api/recipes/filters/options
// =====================================

export const getFilterOptions = async () => {
  const data = await requestJSON(
    `${API_URL}/filters/options`,
  );

  const result = data?.data ?? data;

  return {
    categories: Array.isArray(result?.categories)
      ? result.categories
      : [],

    difficulties: Array.isArray(result?.difficulties)
      ? result.difficulties
      : [],

    subcategories: Array.isArray(result?.subcategories)
      ? result.subcategories
      : [],

    dishTypes: Array.isArray(result?.dishTypes)
      ? result.dishTypes
      : [],
  };
};

// =====================================
// GET SINGLE RECIPE
// GET /api/recipes/:id
// =====================================

export const getRecipeById = async (id) => {
  if (!id) {
    throw new Error("Recipe ID is required");
  }

  return requestJSON(
    `${API_URL}/${encodeURIComponent(String(id))}`,
  );
};

// =====================================
// UPLOAD RECIPE IMAGES
// POST /api/recipes/upload-images
// =====================================

export const uploadRecipeImages = async (filesOrFormData) => {
  let formData;

  if (
    typeof FormData !== "undefined" &&
    filesOrFormData instanceof FormData
  ) {
    formData = filesOrFormData;
  } else {
    formData = new FormData();

    const files = Array.from(filesOrFormData || []);

    if (files.length === 0) {
      throw new Error("Please select at least one image");
    }

    if (files.length > 6) {
      throw new Error("You can upload maximum 6 images");
    }

    files.forEach((file) => {
      formData.append("images", file);
    });
  }

  // Do not set Content-Type manually for FormData.
  // fetch must generate the multipart boundary.
  return requestJSON(`${API_URL}/upload-images`, {
    method: "POST",
    body: formData,
  });
};

// =====================================
// CREATE COMMUNITY RECIPE
// POST /api/recipes
// =====================================

export const createRecipe = async (recipeData) => {
  return requestJSON(
    API_URL,
    jsonOptions("POST", recipeData),
  );
};

// =====================================
// UPDATE COMMUNITY RECIPE
// PUT /api/recipes/:id
// =====================================

export const updateRecipe = async (id, recipeData) => {
  if (!id) {
    throw new Error("Recipe ID is required");
  }

  return requestJSON(
    `${API_URL}/${encodeURIComponent(String(id))}`,
    jsonOptions("PUT", recipeData),
  );
};

// =====================================
// GET MY RECIPES
// GET /api/recipes/my
// =====================================

export const getMyRecipes = async () => {
  return requestJSON(`${API_URL}/my`);
};

// =====================================
// GET COMMUNITY RECIPES
// GET /api/recipes/community
// =====================================

export const getUserRecipes = async () => {
  return requestJSON(`${API_URL}/community`);
};

// =====================================
// PUBLISH / UNPUBLISH RECIPE
// PATCH /api/recipes/:id/publish
// =====================================

export const togglePublishRecipe = async (id) => {
  if (!id) {
    throw new Error("Recipe ID is required");
  }

  return requestJSON(
    `${API_URL}/${encodeURIComponent(String(id))}/publish`,
    {
      method: "PATCH",
    },
  );
};

// =====================================
// RATE COMMUNITY RECIPE
// POST /api/recipes/:id/rating
// =====================================

export const rateRecipe = async (recipeId, rating) => {
  const rawValue =
    rating && typeof rating === "object"
      ? rating.value ??
        rating.rating ??
        rating.stars ??
        rating.ratingValue
      : rating;

  const numericRating = Number(rawValue);

  if (
    !recipeId ||
    rawValue === undefined ||
    rawValue === null ||
    String(rawValue).trim() === "" ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new Error("Please select between 1 and 5 stars.");
  }

  return requestJSON(
    `${API_URL}/${encodeURIComponent(String(recipeId))}/rating`,
    jsonOptions("POST", {
      value: numericRating,
    }),
  );
};

// =====================================
// DELETE COMMUNITY RECIPE
// DELETE /api/recipes/:id
// =====================================

export const deleteRecipe = async (id) => {
  if (!id) {
    throw new Error("Recipe ID is required");
  }

  return requestJSON(
    `${API_URL}/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    },
  );
};
