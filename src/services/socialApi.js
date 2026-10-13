import { apiFetch } from "./apiFetch";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE}/api/social`;
const PROFILE_CACHE_DURATION = 15000;

let myProfileCache = null;
let myProfileCacheUntil = 0;
let pendingProfileRequest = null;

const pendingGets = new Map();

export function clearMyProfileCache() {
  myProfileCache = null;
  myProfileCacheUntil = 0;
  pendingProfileRequest = null;
}

function hasFreshProfileCache() {
  return myProfileCache !== null && Date.now() < myProfileCacheUntil;
}

async function requestJSON(path, options = {}) {
  const url = `${API_URL}${path}`;

  const headers = {
    ...(options.headers || {}),
  };

  let body = options.body;

  if (body && typeof body !== "string" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const response = await apiFetch(url, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || "The request could not be completed.",
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

function getJSONDeduped(path) {
  if (pendingGets.has(path)) {
    return pendingGets.get(path);
  }

  const promise = requestJSON(path, {
    method: "GET",
  }).finally(() => {
    if (pendingGets.get(path) === promise) {
      pendingGets.delete(path);
    }
  });

  pendingGets.set(path, promise);

  return promise;
}

// ========================================
// MY PROFILE
// ========================================

export function getMyProfile() {
  if (hasFreshProfileCache()) {
    return Promise.resolve(myProfileCache);
  }

  if (pendingProfileRequest) {
    return pendingProfileRequest;
  }

  const promise = getJSONDeduped("/profile")
    .then((result) => {
      myProfileCache = result;
      myProfileCacheUntil = Date.now() + PROFILE_CACHE_DURATION;

      return result;
    })
    .catch((error) => {
      clearMyProfileCache();
      throw error;
    })
    .finally(() => {
      if (pendingProfileRequest === promise) {
        pendingProfileRequest = null;
      }
    });

  pendingProfileRequest = promise;

  return promise;
}

export async function updateMyProfile(profile) {
  const result = await requestJSON("/profile", {
    method: "PATCH",
    body: profile,
  });

  clearMyProfileCache();

  if (result?.profile) {
    myProfileCache = {
      ...result,
      profile: result.profile,
    };

    myProfileCacheUntil = Date.now() + PROFILE_CACHE_DURATION;
  }

  return result;
}

// ========================================
// PUBLIC PROFILE
// ========================================

export function getPublicProfile(userId) {
  return getJSONDeduped(`/profile/${encodeURIComponent(userId)}`);
}

// ========================================
// FOLLOW / UNFOLLOW
// ========================================

export function toggleFollow(userId) {
  return requestJSON(`/follow/${encodeURIComponent(userId)}`, {
    method: "POST",
  });
}

// ========================================
// RECIPE SOCIAL DETAILS
// ========================================

export function getRecipeSocial(recipeId) {
  return getJSONDeduped(`/recipes/${encodeURIComponent(recipeId)}/social`);
}

// ========================================
// LIKE / UNLIKE RECIPE
// ========================================

export function toggleRecipeLike(recipeId) {
  return requestJSON(`/recipes/${encodeURIComponent(recipeId)}/like`, {
    method: "POST",
  });
}

// ========================================
// GET LIKED COMMUNITY RECIPES
// ========================================

export function getLikedRecipes() {
  return getJSONDeduped("/liked-recipes");
}

// ========================================
// ADD COMMENT
// ========================================

export function addRecipeComment(recipeId, text) {
  return requestJSON(`/recipes/${encodeURIComponent(recipeId)}/comments`, {
    method: "POST",
    body: { text },
  });
}

// ========================================
// DELETE COMMENT
// ========================================

export function deleteRecipeComment(recipeId, commentId) {
  return requestJSON(
    `/recipes/${encodeURIComponent(recipeId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
    },
  );
}

// Clear profile cache when logging out or auth expires.
if (typeof window !== "undefined") {
  window.addEventListener("savorly:logout", clearMyProfileCache);

  window.addEventListener("auth-expired", clearMyProfileCache);
}
