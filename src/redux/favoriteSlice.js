import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  favorites: [],
  loading: false,
  error: null,
};

const favoriteSlice = createSlice({
  name: "favorites",

  initialState,

  reducers: {
    // =====================================
    // SET ALL FAVORITES
    // =====================================

    setFavorites: (state, action) => {
      const favorites = Array.isArray(action.payload) ? action.payload : [];

      state.favorites = favorites.filter(Boolean).map((id) => String(id));

      state.error = null;
    },

    // =====================================
    // ADD FAVORITE
    // =====================================

    addFavoriteToState: (state, action) => {
      if (!action.payload) {
        return;
      }

      const favoriteId = String(action.payload);

      if (!state.favorites.includes(favoriteId)) {
        state.favorites.push(favoriteId);
      }

      state.error = null;
    },

    // =====================================
    // REMOVE FAVORITE
    // =====================================

    removeFavoriteFromState: (state, action) => {
      if (!action.payload) {
        return;
      }

      const favoriteId = String(action.payload);

      state.favorites = state.favorites.filter(
        (id) => String(id) !== favoriteId,
      );

      state.error = null;
    },

    // =====================================
    // LOADING
    // =====================================

    setFavoriteLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },

    // =====================================
    // ERROR
    // =====================================

    setFavoriteError: (state, action) => {
      state.error = action.payload || null;
    },

    // =====================================
    // CLEAR FAVORITES
    // =====================================

    clearFavorites: (state) => {
      state.favorites = [];
      state.loading = false;
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
