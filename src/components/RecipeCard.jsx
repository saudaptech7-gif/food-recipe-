import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { addFavorite, removeFavorite } from "../services/favoriteApi";

import {
  addFavoriteToState,
  removeFavoriteFromState,
} from "../redux/favoriteSlice";

function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoggedIn } = useSelector((state) => state.auth);

  const favorites = useSelector((state) => state.favorites.favorites);

  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // =====================================
  // RECIPE ID
  // =====================================

  const recipeId = recipe?.id || recipe?._id;

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
  // FAVORITE
  // =====================================

  const isFavorite = favorites.includes(recipeId);

  // =====================================
  // RATING
  // =====================================

  const rating = Number(recipe?.averageRating || recipe?.rating || 0);

  const ratingCount = Number(recipe?.ratingCount || recipe?.voteCount || 0);

  // =====================================
  // CATEGORY
  // =====================================

  const category =
    recipe?.mainCategory || recipe?.category || recipe?.subcategory || "Recipe";

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
    if (!recipeId) {
      return;
    }

    navigate(`/recipe/${recipeId}`);
  };

  // =====================================
  // FAVORITE
  // =====================================

  const handleFavorite = async (event) => {
    event.stopPropagation();

    if (!recipeId) {
      return;
    }

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        await removeFavorite(recipeId);

        dispatch(removeFavoriteFromState(recipeId));
      } else {
        await addFavorite(recipeId);

        dispatch(addFavoriteToState(recipeId));
      }
    } catch (error) {
      console.error("Favorite error:", error.message);
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

  return (
    <article
      className={`recipe-card ${
        isCommunityRecipe ? "community-recipe-card" : "archive-recipe-card"
      }`}
      onClick={handleCardClick}
    >
      {/* ================================= */}
      {/* IMAGE */}
      {/* ================================= */}

      <div className="recipe-image-wrapper">
        <img
          className="recipe-image"
          src={recipeImage}
          alt={recipe?.name || "Recipe"}
          loading="lazy"
          onError={handleImageError}
        />

        {/* Recipe type */}
        <div className="recipe-type-badge">
          {isCommunityRecipe ? "COMMUNITY" : "OUR RECIPES"}
        </div>

        {/* Category */}
        <div className="recipe-category-badge">{category}</div>

        {/* Favorite */}
        <button
          type="button"
          className={`favorite-button ${isFavorite ? "favorite-active" : ""}`}
          onClick={handleFavorite}
          disabled={favoriteLoading}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {favoriteLoading ? "..." : isFavorite ? "♥" : "♡"}
        </button>
      </div>

      {/* ================================= */}
      {/* CONTENT */}
      {/* ================================= */}

      <div className="recipe-content">
        {/* Rating */}

        <div className="recipe-rating">
          <span>★</span>

          <strong>{rating > 0 ? rating.toFixed(1) : "N/A"}</strong>

          {ratingCount > 0 && <small>({ratingCount})</small>}
        </div>

        {/* Recipe name */}

        <h2>{recipe?.name || "Untitled Recipe"}</h2>

        {/* Description */}

        <p className="recipe-description">
          {recipe?.description || "A delicious recipe to try at home."}
        </p>

        {/* Community author */}

        {isCommunityRecipe && recipe?.createdBy && (
          <div className="recipe-card-author">
            <span>👨‍🍳</span>

            <span>
              {typeof recipe.createdBy === "object"
                ? recipe.createdBy.name
                : "FoodRecipe user"}
            </span>
          </div>
        )}

        {/* Footer */}

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
      </div>
    </article>
  );
}

export default RecipeCard;
