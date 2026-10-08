import { apiFetch } from "./apiFetch";

const API_URL = `${import.meta.env.VITE_API_URL}/api/favorites`;

// =====================================
// RESPONSE HELPER
// =====================================

const getResponseData = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
};

// =====================================
// GET FAVORITES
// =====================================

export const getFavorites = async () => {
  const response = await apiFetch(API_URL);

  const data = await getResponseData(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch favorites");
  }

  return data;
};

// =====================================
// ADD FAVORITE
// =====================================

export const addFavorite = async (recipeId) => {
  if (
    recipeId === undefined ||
    recipeId === null ||
    String(recipeId).trim() === ""
  ) {
    throw new Error("Recipe ID is required");
  }

  const cleanRecipeId = String(recipeId).trim();

  const response = await apiFetch(
    `${API_URL}/${encodeURIComponent(cleanRecipeId)}`,
    {
      method: "POST",
    },
  );

  const data = await getResponseData(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to add favorite");
  }

  return data;
};

// =====================================
// REMOVE FAVORITE
// =====================================

export const removeFavorite = async (recipeId) => {
  if (
    recipeId === undefined ||
    recipeId === null ||
    String(recipeId).trim() === ""
  ) {
    throw new Error("Recipe ID is required");
  }

  const cleanRecipeId = String(recipeId).trim();

  const response = await apiFetch(
    `${API_URL}/${encodeURIComponent(cleanRecipeId)}`,
    {
      method: "DELETE",
    },
  );

  const data = await getResponseData(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to remove favorite");
  }

  return data;
};
