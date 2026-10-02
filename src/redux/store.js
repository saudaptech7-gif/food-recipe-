import { configureStore } from "@reduxjs/toolkit";

import recipeReducer from "./recipeSlice";
import authReducer from "./authSlice";
import favoriteReducer from "./favoriteSlice";

export const store = configureStore({
  reducer: {
    recipes: recipeReducer,
    auth: authReducer,
    favorites: favoriteReducer,
  },
});
