import { apiFetch } from "./apiFetch";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE}/api/favorites`;

const CACHE_DURATION = 15 * 1000;

let favoritesCache = null;
let favoritesCacheUntil = 0;
let pendingFavoritesRequest = null;

// =====================================
// CACHE INVALIDATION
// =====================================

export function clearFavoritesCache() {
  favoritesCache = null;
  favoritesCacheUntil = 0;
}

// Clear cached data on session expiration or logout.
if (typeof window !== "undefined") {
  window.addEventListener("auth-expired", clearFavoritesCache);

  window.addEventListener("savorly:logout", clearFavoritesCache);
}

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
    return { message: text };
  }
};

async function requestFavorites(url, options = {}) {
  const response = await apiFetch(url, options);
  const data = await getResponseData(response);

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed (${response.status}).`,
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

// =====================================
// GET FAVORITES
// =====================================

export function getFavorites() {
  if (favoritesCache !== null && Date.now() < favoritesCacheUntil) {
    return Promise.resolve(favoritesCache);
  }

  if (pendingFavoritesRequest) {
    return pendingFavoritesRequest;
  }

  const request = requestFavorites(API_URL)
    .then((data) => {
      favoritesCache = data;
      favoritesCacheUntil = Date.now() + CACHE_DURATION;

      return data;
    })
    .finally(() => {
      if (pendingFavoritesRequest === request) {
        pendingFavoritesRequest = null;
      }
    });

  pendingFavoritesRequest = request;

  return request;
}

// =====================================
// ADD FAVORITE
// =====================================

export async function addFavorite(recipeId) {
  if (
    recipeId === undefined ||
    recipeId === null ||
    String(recipeId).trim() === ""
  ) {
    throw new Error("Recipe ID is required.");
  }

  const cleanRecipeId = String(recipeId).trim();

  const result = await requestFavorites(
    `${API_URL}/${encodeURIComponent(cleanRecipeId)}`,
    { method: "POST" },
  );

  clearFavoritesCache();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("savorly:favorites-updated"));
  }

  return result;
}

// =====================================
// REMOVE FAVORITE
// =====================================

export async function removeFavorite(recipeId) {
  if (
    recipeId === undefined ||
    recipeId === null ||
    String(recipeId).trim() === ""
  ) {
    throw new Error("Recipe ID is required.");
  }

  const cleanRecipeId = String(recipeId).trim();

  const result = await requestFavorites(
    `${API_URL}/${encodeURIComponent(cleanRecipeId)}`,
    { method: "DELETE" },
  );

  clearFavoritesCache();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("savorly:favorites-updated"));
  }

  return result;
}
