/* eslint-disable no-undef */
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Home from "./pages/Home";
import RecipeDetails from "./pages/RecipeDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Favorites from "./pages/Favorite";
import Profile from "./pages/Profile";
import Cloudinarytest from "./pages/Cloudinarytest";
import CreateRecipe from "./pages/CreateRecipe";

import ProtectedRoute from "./components/ProtectedRoute";

import { getFavorites } from "./services/favoriteApi";
import { setFavorites } from "./redux/favoriteSlice";

function App() {
  const dispatch = useDispatch();

  const loading = useSelector((state) => state.auth.loading);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isLoggedIn) {
        dispatch(setFavorites([]));
        return;
      }

      try {
        const data = await getFavorites();

        const favoriteIds = data.favorites.map((recipe) => recipe.id);

        dispatch(setFavorites(favoriteIds));
      } catch (error) {
        console.error("Failed to load favorites:", error);

        dispatch(setFavorites([]));
      }
    };

    if (!loading) {
      loadFavorites();
    }
  }, [isLoggedIn, loading, dispatch]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your kitchen...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* RECIPE DETAILS */}
        <Route path="/recipe/:id" element={<RecipeDetails />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        {/* CLOUDINARY TEST */}
        <Route path="/cloudinary-test" element={<Cloudinarytest />} />

        {/* FAVORITES */}
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* CREATE RECIPE */}
        <Route
          path="/create-recipe"
          element={
            <ProtectedRoute>
              <CreateRecipe />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
