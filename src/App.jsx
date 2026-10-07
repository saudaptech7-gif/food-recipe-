import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// =====================================
// PAGES
// =====================================

import Home from "./pages/Home";
import RecipeDetails from "./pages/RecipeDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Favorites from "./pages/Favorite";
import Profile from "./pages/Profile";
import Cloudinarytest from "./pages/Cloudinarytest";
import CreateRecipe from "./pages/CreateRecipe";
import EditRecipe from "./pages/EditRecipe";
import Community from "./pages/Community";

// =====================================
// COMPONENTS
// =====================================

import ProtectedRoute from "./components/ProtectedRoute";

// =====================================
// API
// =====================================

import { getFavorites } from "./services/favoriteApi";

// =====================================
// REDUX
// =====================================

import { setFavorites, clearFavorites } from "./redux/favoriteSlice";

import { logout } from "./redux/authSlice";

// =====================================
// APP
// =====================================

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // =====================================
  // AUTH STATE
  // =====================================

  const loading = useSelector((state) => state.auth.loading);

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  // =====================================
  // HANDLE EXPIRED AUTH SESSION
  // =====================================

  useEffect(() => {
    const handleAuthExpired = () => {
      dispatch(logout());

      dispatch(clearFavorites());

      navigate("/login", {
        replace: true,
        state: {
          message: "Your session has expired. Please login again.",
        },
      });
    };

    window.addEventListener("auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [dispatch, navigate]);

  // =====================================
  // LOAD FAVORITES
  // =====================================

  useEffect(() => {
    const loadFavorites = async () => {
      // User logged out
      if (!isLoggedIn) {
        dispatch(clearFavorites());
        return;
      }

      try {
        const data = await getFavorites();

        const favoriteIds = Array.isArray(data?.favorites)
          ? data.favorites
              .map((recipe) => recipe?.id || recipe?._id)
              .filter(Boolean)
              .map((id) => String(id))
          : [];

        dispatch(setFavorites(favoriteIds));
      } catch (error) {
        console.error("Failed to load favorites:", error);

        dispatch(setFavorites([]));
      }
    };

    // Wait until authentication
    // check is completed
    if (!loading) {
      loadFavorites();
    }
  }, [isLoggedIn, loading, dispatch]);

  // =====================================
  // APP LOADING
  // =====================================

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>

        <p>Preparing your kitchen...</p>
      </div>
    );
  }

  // =====================================
  // ROUTES
  // =====================================

  return (
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
      <Route
        path="/edit-recipe/:id"
        element={
          <ProtectedRoute>
            <EditRecipe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// =====================================
// BROWSER ROUTER
// =====================================

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;
