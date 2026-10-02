import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  recipes: [],
  loading: false,
  error: null,

  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalRecipes: 0,
  },

  filters: {
    category: "",
    search: "",
    difficulty: "",
    subcategory: "",
    dishType: "",
  },
};

const recipeSlice = createSlice({
  name: "recipes",

  initialState,

  reducers: {
    setRecipes: (state, action) => {
      state.recipes = action.payload;
    },

    setPagination: (state, action) => {
      state.pagination = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    setFilters: (state, action) => {
      state.filters = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {
        category: "",
        search: "",
        difficulty: "",
        subcategory: "",
        dishType: "",
      };
    },
  },
});

export const {
  setRecipes,
  setPagination,
  setLoading,
  setError,
  setFilters,
  clearFilters,
} = recipeSlice.actions;

export default recipeSlice.reducer;
