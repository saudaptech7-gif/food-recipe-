
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../services/favoriteApi";

import {
  setFavorites,
  setFavoriteLoading,
  setFavoriteError,
  addFavoriteToState,
  removeFavoriteFromState,
} from "../redux/favoriteSlice";

// =====================================
// FAVORITES RESPONSE HELPERS
// =====================================

function extractFavoriteList(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.favorites)) {
    return data.favorites;
  }

  if (Array.isArray(data?.data?.favorites)) {
    return data.data.favorites;
  }

  return [];
}

function getRecipeId(item) {
  if (item === null || item === undefined) {
    return "";
  }

  if (typeof item === "string" || typeof item === "number") {
    return String(item).trim();
  }

  if (typeof item === "object") {
    if (item.recipe !== undefined) {
      return getRecipeId(item.recipe);
    }

    const id = item._id ?? item.id ?? item.recipeId;

    return id === undefined || id === null ? "" : String(id).trim();
  }

  return "";
}

function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth || {});
  const favoriteState = useSelector((state) => state.favorites || {});

  const isLoggedIn = Boolean(
    auth.isLoggedIn ||
    auth.isAuthenticated ||
    auth.token ||
    auth.user ||
    auth.currentUser,
  );

  const favorites = Array.isArray(favoriteState.favorites)
    ? favoriteState.favorites.map(String)
    : [];

  // `loaded` is set by the updated favoriteSlice.
  const favoritesLoaded = Boolean(favoriteState.loaded);
  const favoritesLoading = Boolean(favoriteState.loading);

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteRetry, setFavoriteRetry] = useState(0);

  // =====================================
  // RECIPE ID
  // =====================================

  const recipeId = recipe?._id ?? recipe?.id ?? null;
  const recipeIdString =
    recipeId === null || recipeId === undefined ? "" : String(recipeId);

  // =====================================
  // HYDRATE FAVORITES ONCE
  // Multiple cards share the same service request.
  // =====================================

  useEffect(() => {
    let active = true;

    if (!isLoggedIn || favoritesLoaded) {
      return undefined;
    }

    async function loadFavorites() {
      dispatch(setFavoriteLoading(true));
      dispatch(setFavoriteError(null));

      try {
        const response = await getFavorites();
        const favoriteList = extractFavoriteList(response);

        if (active) {
          dispatch(setFavorites(favoriteList));
        }
      } catch (error) {
        console.error("Could not load favorites:", error);

        if (active) {
          dispatch(
            setFavoriteError(error?.message || "Could not load favorites."),
          );
        }
      } finally {
        if (active) {
          dispatch(setFavoriteLoading(false));
        }
      }
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, [isLoggedIn, favoritesLoaded, favoriteRetry, dispatch]);

  // =====================================
  // RECIPE IMAGE
  // =====================================

  const recipeImage =
    Array.isArray(recipe?.images) && recipe.images.length > 0
      ? recipe.images[0]
      : recipe?.image || "/fallback.jpg";

  // =====================================
  // RECIPE TYPE
  // =====================================

  const isCommunityRecipe = recipe?.recipeType === "community";

  // =====================================
  // FAVORITE STATE
  // =====================================

  const isFavorite =
    recipeIdString !== "" && favorites.includes(recipeIdString);

  // =====================================
  // RATING
  // =====================================

  const rating = Number(recipe?.averageRating || recipe?.rating || 0);

  const ratingCount = Number(recipe?.ratingCount || recipe?.voteCount || 0);

  // =====================================
  // CATEGORY
  // =====================================

  const category =
    recipe?.mainCategory ||
    recipe?.maincategory ||
    recipe?.category ||
    recipe?.subcategory ||
    "Recipe";

  // =====================================
  // TIME
  // =====================================

  const preparationTime = recipe?.times?.preparation || recipe?.prepTime || "—";

  // =====================================
  // SERVINGS
  // =====================================

  const servings = recipe?.servings || recipe?.serves || "—";

  // =====================================
  // DIFFICULTY
  // =====================================

  const difficulty = recipe?.difficulty || "Easy";

  // =====================================
  // OPEN RECIPE
  // =====================================

  const handleCardClick = () => {
    if (!recipeIdString) {
      return;
    }

    navigate(`/recipe/${encodeURIComponent(recipeIdString)}`);
  };

  // =====================================
  // FAVORITE TOGGLE
  // =====================================

  const handleFavorite = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!recipeIdString || favoriteLoading) {
      return;
    }

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      setFavoriteLoading(true);
      setFavoriteMessage("");
      dispatch(setFavoriteError(null));

      // If favorite hydration failed, try to reload the
      // current list before deciding whether to add/remove.
      let currentlyFavorite = isFavorite;

      if (!favoritesLoaded) {
        const response = await getFavorites();
        const favoriteList = extractFavoriteList(response);

        const favoriteIds = favoriteList.map(getRecipeId).filter(Boolean);

        dispatch(setFavorites(favoriteIds));

        currentlyFavorite = favoriteIds.includes(recipeIdString);
      }

      if (currentlyFavorite) {
        await removeFavorite(recipeIdString);

        dispatch(removeFavoriteFromState(recipeIdString));

        setFavoriteMessage("Removed from favorites.");
      } else {
        await addFavorite(recipeIdString);

        dispatch(addFavoriteToState(recipeIdString));

        setFavoriteMessage("Added to favorites.");
      }
    } catch (error) {
      console.error("Favorite error:", error);

      setFavoriteMessage(error?.message || "Could not update favorite.");

      dispatch(
        setFavoriteError(error?.message || "Could not update favorite."),
      );

      // Allow a fresh hydration attempt if the list could
      // not be loaded previously.
      if (!favoritesLoaded) {
        setFavoriteRetry((count) => count + 1);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  // =====================================
  // IMAGE ERROR
  // =====================================

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/fallback.jpg";
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <article
      className={`recipe-card ${
        isCommunityRecipe ? "community-recipe-card" : "archive-recipe-card"
      }`}
      onClick={handleCardClick}
    >
      {/* IMAGE */}

      <div className="recipe-image-wrapper">
        <img
          className="recipe-image"
          src={recipeImage}
          alt={recipe?.name || "Recipe"}
          loading="lazy"
          onError={handleImageError}
        />

        <div className="recipe-type-badge">
          {isCommunityRecipe ? "COMMUNITY" : "OUR RECIPES"}
        </div>

        <div className="recipe-category-badge">{category}</div>

        <button
          type="button"
          className={`favorite-button ${isFavorite ? "favorite-active" : ""}`}
          onClick={handleFavorite}
          disabled={favoriteLoading || (isLoggedIn && favoritesLoading)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {favoriteLoading ? "..." : isFavorite ? "♥" : "♡"}
        </button>
      </div>

      {/* CONTENT */}

      <div className="recipe-content">
        <div className="recipe-rating">
          <span>★</span>

          <strong>{rating > 0 ? rating.toFixed(1) : "N/A"}</strong>

          {ratingCount > 0 && <small>({ratingCount})</small>}
        </div>

        <h2>{recipe?.name || "Untitled Recipe"}</h2>

        <p className="recipe-description">
          {recipe?.description || "A delicious recipe to try at home."}
        </p>

        {isCommunityRecipe && recipe?.createdBy && (
          <div className="recipe-card-author">
            <span>👨‍🍳</span>

            <span>
              {typeof recipe.createdBy === "object"
                ? recipe.createdBy.chef ||
                  recipe.createdBy.name ||
                  "Savorly Chef"
                : "Savorly Chef"}
            </span>
          </div>
        )}

        <div className="recipe-card-footer">
          <div className="recipe-meta">
            <span>⏱</span>
            {preparationTime}
          </div>

          <div className="recipe-meta">
            <span>👥</span>
            {servings}
          </div>

          <div className="recipe-meta">
            <span>●</span>
            {difficulty}
          </div>
        </div>

        {favoriteMessage && (
          <p className="recipe-favorite-status" role="status">
            {favoriteMessage}
          </p>
        )}
      </div>
    </article>
  );
}

export default RecipeCard;
