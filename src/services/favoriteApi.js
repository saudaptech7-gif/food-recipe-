const API_URL = `${import.meta.env.VITE_API_URL}/api/favorites`;

export const getFavorites = async () => {
  const response = await fetch(API_URL, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch favorites");
  }

  return data;
};

export const addFavorite = async (recipeId) => {
  const response = await fetch(`${API_URL}/${recipeId}`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add favorite");
  }

  return data;
};

export const removeFavorite = async (recipeId) => {
  const response = await fetch(`${API_URL}/${recipeId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove favorite");
  }

  return data;
};
