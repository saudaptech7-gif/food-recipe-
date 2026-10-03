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
    setFavorites: (state, action) => {
      state.favorites = action.payload;
    },

    addFavoriteToState: (state, action) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },

    removeFavoriteFromState: (state, action) => {
      state.favorites = state.favorites.filter((id) => id !== action.payload);
    },

    setFavoriteLoading: (state, action) => {
      state.loading = action.payload;
    },

    setFavoriteError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setFavorites,
  addFavoriteToState,
  removeFavoriteFromState,
  setFavoriteLoading,
  setFavoriteError,
} = favoriteSlice.actions;

export default favoriteSlice.reducer;
