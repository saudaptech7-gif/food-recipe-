import { createSlice } from "@reduxjs/toolkit";

// =====================================
// NORMALIZE FAVORITE ID
// =====================================

function getFavoriteId(item) {
  if (item === null || item === undefined) {
    return "";
  }

  if (typeof item === "string" || typeof item === "number") {
    return String(item).trim();
  }

  if (typeof item === "object") {
    if (item.recipe !== undefined) {
      return getFavoriteId(item.recipe);
    }

    const id = item._id ?? item.id ?? item.recipeId;

    return id === undefined || id === null ? "" : String(id).trim();
  }

  return "";
}

function normalizeFavoriteIds(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return [...new Set(items.map(getFavoriteId).filter(Boolean))];
}

// =====================================
// INITIAL STATE
// =====================================

const initialState = {
  favorites: [],
  loading: false,
  loaded: false,
  error: null,
};

// =====================================
// FAVORITE SLICE
// =====================================

const favoriteSlice = createSlice({
  name: "favorites",
  initialState,

  reducers: {
    setFavorites: (state, action) => {
      state.favorites = normalizeFavoriteIds(action.payload);

      state.loaded = true;
      state.loading = false;
      state.error = null;
    },

    addFavoriteToState: (state, action) => {
      const favoriteId = getFavoriteId(action.payload);

      if (!favoriteId) return;

      if (!state.favorites.includes(favoriteId)) {
        state.favorites.push(favoriteId);
      }

      state.error = null;
    },

    removeFavoriteFromState: (state, action) => {
      const favoriteId = getFavoriteId(action.payload);

      if (!favoriteId) return;

      state.favorites = state.favorites.filter((id) => id !== favoriteId);

      state.error = null;
    },

    setFavoriteLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },

    setFavoriteError: (state, action) => {
      state.error = action.payload || null;
    },

    clearFavorites: (state) => {
      state.favorites = [];
      state.loading = false;
      state.loaded = false;
      state.error = null;
    },
  },
});

export const {
  setFavorites,
  addFavoriteToState,
  removeFavoriteFromState,
  setFavoriteLoading,
  setFavoriteError,
  clearFavorites,
} = favoriteSlice.actions;

export default favoriteSlice.reducer;
