import { apiFetch } from "./apiFetch";

const API_URL = `${import.meta.env.VITE_API_URL}/api/favorites`;

// =====================================
// GET FAVORITES
// =====================================

export const getFavorites = async () => {
  const response = await apiFetch(API_URL);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch favorites");
  }

  return data;
};

// =====================================
// ADD FAVORITE
// =====================================

export const addFavorite = async (recipeId) => {
  if (!recipeId) {
    throw new Error("Recipe ID is required");
  }

  const response = await apiFetch(
    `${API_URL}/${encodeURIComponent(String(recipeId))}`,
    {
      method: "POST",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add favorite");
  }

  return data;
};

// =====================================
// REMOVE FAVORITE
// =====================================

export const removeFavorite = async (recipeId) => {
  if (!recipeId) {
    throw new Error("Recipe ID is required");
  }

  const response = await apiFetch(
    `${API_URL}/${encodeURIComponent(String(recipeId))}`,
    {
      method: "DELETE",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove favorite");
  }

  return data;
};
