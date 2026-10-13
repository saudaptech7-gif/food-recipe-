
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Header from "../components/Header";

import {
  getRecipeById,
  rateRecipe,
  deleteRecipe,
} from "../services/recipeApi";

import {
  addFavorite,
  removeFavorite,
} from "../services/favoriteApi";

import {
  addFavoriteToState,
  removeFavoriteFromState,
} from "../redux/favoriteSlice";

import "./RecipeDetails.css";

function RecipeDetails() {
  const { id } = useParams();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth.user);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const favorites = useSelector((state) => state.favorites.favorites);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Ingredients checklist state
  const [checkedIngredients, setCheckedIngredients] = useState({});

  const recipeId = recipe?.id || recipe?._id || id;
  const isCommunityRecipe = recipe?.recipeType === "community";

  const isOwnRecipe = useMemo(() => {
    if (!currentUser || !recipe?.createdBy) return false;

    const currentUserId = currentUser.id || currentUser._id;

    const ownerId =
      recipe.createdBy?.id ||
      recipe.createdBy?._id ||
      recipe.createdBy;

    if (!currentUserId || !ownerId) return false;

    return String(currentUserId) === String(ownerId);
  }, [currentUser, recipe]);

  const isFavorite = favorites?.some(
    (favoriteId) => String(favoriteId) === String(recipeId),
  );

  // Fetch recipe
  useEffect(() => {
    let mounted = true;

    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRecipeById(id);
        const recipeData = data?.recipe || data;

        if (!recipeData) {
          throw new Error("Recipe data was not returned by the server.");
        }

        if (!mounted) return;

        setRecipe(recipeData);

        setSelectedRating(
          Number(recipeData.userRating || recipeData.myRating || 0),
        );

        setCheckedIngredients({});
      } catch (fetchError) {
        console.error("Fetch recipe error:", fetchError);

        if (mounted) {
          setError(fetchError.message || "Failed to load recipe.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecipe();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Toggle ingredient checkbox
  const handleIngredientToggle = (index) => {
    setCheckedIngredients((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  };

  // Save / unsave recipe
  const handleFavorite = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!recipeId || favoriteLoading) return;

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        await removeFavorite(recipeId);
        dispatch(removeFavoriteFromState(String(recipeId)));
      } else {
        await addFavorite(recipeId);
        dispatch(addFavoriteToState(String(recipeId)));
      }
    } catch (favoriteError) {
      console.error("Favorite error:", favoriteError);
      alert(favoriteError.message || "Failed to update favorite.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Rate recipe
  const handleRating = async (value) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (isOwnRecipe || ratingLoading) return;

    try {
      setRatingLoading(true);

      const data = await rateRecipe(recipeId, value);

      setSelectedRating(Number(data?.userRating ?? value));

      setRecipe((previous) => ({
        ...previous,
        averageRating:
          data?.averageRating ??
          previous?.averageRating ??
          previous?.rating ??
          0,
        ratingCount:
          data?.ratingCount ??
          previous?.ratingCount ??
          previous?.voteCount ??
          0,
        rating: data?.averageRating ?? previous?.rating ?? 0,
        voteCount: data?.ratingCount ?? previous?.voteCount ?? 0,
      }));
    } catch (ratingError) {
      console.error("Rating error:", ratingError);
      alert(ratingError.message || "Failed to save rating.");
    } finally {
      setRatingLoading(false);
    }
  };

  // Delete own recipe
  const handleDelete = async () => {
    if (!isOwnRecipe) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe?",
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      await deleteRecipe(recipeId);
      navigate("/community");
    } catch (deleteError) {
      console.error("Delete error:", deleteError);
      alert(deleteError.message || "Failed to delete recipe.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="recipe-details-page">
        <Header />
        <div className="details-loading">
          <div className="loading-spinner" />
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="recipe-details-page">
        <Header />
        <div className="details-error">
          <span>🍽️</span>
          <h2>Recipe Not Found</h2>
          <p>{error || "This recipe could not be found."}</p>
          <button type="button" onClick={() => navigate("/")}>
            ← Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  const images =
    Array.isArray(recipe.images) && recipe.images.length > 0
      ? recipe.images
      : recipe.image
        ? [recipe.image]
        : ["/fallback.jpg"];

  const nutrients = recipe.nutrients || {};

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  const rawAverageRating =
    recipe.averageRating ?? recipe.rating ?? recipe.rattings ?? 0;

  const averageRatingNumber = Number(rawAverageRating) || 0;
  const averageRating = averageRatingNumber.toFixed(1);

  const ratingCount =
    Number(recipe.ratingCount ?? recipe.voteCount ?? recipe.vote_count ?? 0) ||
    0;

  const category =
    recipe.mainCategory ||
    recipe.maincategory ||
    recipe.category ||
    recipe.subcategory ||
    "Recipe";

  const preparationTime =
    recipe.times?.preparation ||
    recipe.times?.Preparation ||
    recipe.prepTime ||
    "—";

  const cookingTime =
    recipe.times?.cooking ||
    recipe.times?.Cooking ||
    recipe.cookTime ||
    "—";

  const servings = recipe.servings || recipe.serves || "—";
  const difficulty = recipe.difficulty || recipe.difficult || "—";
  const authorName = recipe.createdBy?.name || recipe.author || "Savorly";

  const checkedCount = Object.values(checkedIngredients).filter(
    Boolean,
  ).length;

  return (
    <div className="recipe-details-page">
      <Header />

      <main className="recipe-details-container">
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        {/* HERO */}
        <section className="recipe-hero-details">
          <div className="recipe-image-gallery">
            <img
              src={images[0]}
              alt={recipe.name || "Recipe"}
              onError={(event) => {
                event.currentTarget.src = "/fallback.jpg";
              }}
            />

            {images.length > 1 && (
              <div className="recipe-image-count">
                +{images.length - 1}
              </div>
            )}
          </div>

          <div className="recipe-details-content">
            <div className="recipe-details-badges">
              <span className="recipe-category-badge">{category}</span>

              <span
                className={
                  isCommunityRecipe ? "community-badge" : "archive-badge"
                }
              >
                {isCommunityRecipe ? "Community Recipe" : "Savorly Recipe"}
              </span>
            </div>

            <h1>{recipe.name || "Untitled Recipe"}</h1>

            <p className="recipe-details-description">
              {recipe.description || "No description available."}
            </p>

            <div className="recipe-rating-summary">
              <div className="rating-stars-display">
                {"★".repeat(
                  Math.min(Math.max(Math.round(averageRatingNumber), 0), 5),
                )}
                <span>
                  {"★".repeat(
                    5 -
                      Math.min(
                        Math.max(Math.round(averageRatingNumber), 0),
                        5,
                      ),
                  )}
                </span>
              </div>

              <strong>{averageRating}</strong>

              <small>
                ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
              </small>
            </div>

            <div className="recipe-meta-row">
              <div>
                <span>PREP</span>
                <strong>{preparationTime}</strong>
              </div>

              <div>
                <span>COOK</span>
                <strong>{cookingTime}</strong>
              </div>

              <div>
                <span>SERVES</span>
                <strong>{servings}</strong>
              </div>

              <div>
                <span>LEVEL</span>
                <strong>{difficulty}</strong>
              </div>
            </div>

            <div className="recipe-action-row">
              <button
                type="button"
                className={`favorite-detail-button ${
                  isFavorite ? "favorite-active" : ""
                }`}
                onClick={handleFavorite}
                disabled={favoriteLoading}
              >
                {favoriteLoading
                  ? "Saving..."
                  : isFavorite
                    ? "♥ Saved"
                    : "♡ Save Recipe"}
              </button>

              {isOwnRecipe && (
                <>
                  <button
                    type="button"
                    className="edit-recipe-button"
                    onClick={() => navigate(`/edit-recipe/${recipeId}`)}
                  >
                    ✎ Edit
                  </button>

                  <button
                    type="button"
                    className="delete-recipe-button"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "🗑 Delete"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* RATING */}
        <section className="recipe-rating-section">
          <div>
            <span className="section-eyebrow">YOUR EXPERIENCE</span>

            <h2>{isOwnRecipe ? "Your Recipe" : "Rate this recipe"}</h2>

            <p>
              {isOwnRecipe
                ? "You cannot rate your own recipe."
                : isLoggedIn
                  ? selectedRating
                    ? "You can change your rating anytime."
                    : "How would you rate this recipe?"
                  : "Login to leave your rating."}
            </p>
          </div>

          {!isOwnRecipe && (
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={
                    star <= selectedRating
                      ? "rating-star-button active"
                      : "rating-star-button"
                  }
                  onClick={() => handleRating(star)}
                  disabled={ratingLoading}
                  aria-label={`Rate ${star} out of 5`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        </section>

        {/* INGREDIENTS + METHOD */}
        <section className="recipe-main-grid">
          <div className="recipe-section ingredients-section">
            <span className="section-eyebrow">WHAT YOU NEED</span>

            <div className="ingredients-heading-row">
              <h2>Ingredients</h2>

              {ingredients.length > 0 && (
                <span className="ingredients-progress">
                  {checkedCount}/{ingredients.length} ready
                </span>
              )}
            </div>

            {ingredients.length > 0 ? (
              <div className="ingredients-list">
                {ingredients.map((ingredient, index) => {
                  const ingredientText =
                    typeof ingredient === "object" && ingredient !== null
                      ? ingredient.name ||
                        ingredient.ingredient ||
                        JSON.stringify(ingredient)
                      : ingredient;

                  const isChecked = Boolean(checkedIngredients[index]);

                  return (
                    <label
                      className={`ingredient-item ${
                        isChecked ? "ingredient-checked" : ""
                      }`}
                      key={`${String(ingredientText)}-${index}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleIngredientToggle(index)}
                        aria-label={`Mark ${ingredientText} as ${
                          isChecked ? "not ready" : "ready"
                        }`}
                      />

                      <span className="ingredient-checkbox" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      </span>

                      <span className="ingredient-text">
                        {ingredientText}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p>No ingredients available.</p>
            )}
          </div>

          <div className="recipe-section">
            <span className="section-eyebrow">LET'S COOK</span>

            <h2>Method</h2>

            {steps.length > 0 ? (
              <div className="steps-list">
                {steps.map((step, index) => (
                  <div className="step-item" key={`${String(step)}-${index}`}>
                    <span className="step-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p>
                      {typeof step === "object" && step !== null
                        ? step.step ||
                          step.description ||
                          step.text ||
                          JSON.stringify(step)
                        : step}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No cooking steps available.</p>
            )}
          </div>
        </section>

        {/* NUTRITION */}
        <section className="nutrition-section">
          <div>
            <span className="section-eyebrow">PER SERVING</span>
            <h2>Nutrition</h2>
          </div>

          <div className="nutrition-grid">
            {[
              ["Calories", nutrients.kcal, "kcal"],
              ["Fat", nutrients.fat, "g"],
              ["Saturates", nutrients.saturates, "g"],
              ["Carbs", nutrients.carbs, "g"],
              ["Sugars", nutrients.sugars, "g"],
              ["Fibre", nutrients.fibre, "g"],
              ["Protein", nutrients.protein, "g"],
              ["Salt", nutrients.salt, "g"],
            ].map(([label, value, unit]) => (
              <div className="nutrition-item" key={label}>
                <small>{label}</small>

                <strong>
                  {value !== undefined && value !== null && value !== ""
                    ? `${value} ${unit}`
                    : "—"}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* AUTHOR */}
        <footer className="recipe-author-footer">
          <div className="author-avatar">
            {authorName?.charAt(0)?.toUpperCase() || "S"}
          </div>

          <div>
            <small>RECIPE BY</small>
            <strong>{authorName}</strong>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default RecipeDetails;
