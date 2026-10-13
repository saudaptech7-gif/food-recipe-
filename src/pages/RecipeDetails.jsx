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

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth.user);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const favorites = useSelector(
    (state) => state.favorites.favorites
  );

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const recipeId = recipe?.id || recipe?._id || id;
  const isCommunityRecipe = recipe?.recipeType === "community";

  const showNotification = (message, type = "error") => {
    setNotification({
      message,
      type,
      id: Date.now(),
    });
  };

  useEffect(() => {
    if (!notification) return undefined;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification]);

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
    (favoriteId) => String(favoriteId) === String(recipeId)
  );

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
          Number(recipeData?.userRating || recipeData?.myRating || 0)
        );
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

        showNotification("Recipe removed from your favorites.", "success");
      } else {
        await addFavorite(recipeId);
        dispatch(addFavoriteToState(String(recipeId)));

        showNotification("Recipe saved to your favorites.", "success");
      }
    } catch (favoriteError) {
      console.error("Favorite error:", favoriteError);

      showNotification(
        favoriteError.message || "Failed to update favorite."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRating = async (value) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (isOwnRecipe || ratingLoading) return;

    try {
      setRatingLoading(true);

      const data = await rateRecipe(recipeId, value);

      setSelectedRating(Number(data?.userRating || value));

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

      showNotification(
        data?.message || "Your rating has been saved.",
        "success"
      );
    } catch (ratingError) {
      console.error("Rating error:", ratingError);

      showNotification(
        ratingError.message || "Failed to save rating."
      );
    } finally {
      setRatingLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwnRecipe || deleteLoading) return;

    try {
      setDeleteLoading(true);

      await deleteRecipe(recipeId);

      setShowDeleteConfirm(false);

      showNotification("Recipe deleted successfully.", "success");

      setTimeout(() => {
        navigate("/community");
      }, 900);
    } catch (deleteError) {
      console.error("Delete error:", deleteError);

      setShowDeleteConfirm(false);

      showNotification(
        deleteError.message || "Failed to delete recipe."
      );
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

        {notification && (
          <NotificationCard
            notification={notification}
            onClose={() => setNotification(null)}
          />
        )}
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

  const averageRatingNumber =
    Number(
      recipe.averageRating ??
      recipe.rating ??
      recipe.rattings ??
      0
    ) || 0;

  const averageRating = averageRatingNumber.toFixed(1);

  const ratingCount =
    Number(
      recipe.ratingCount ??
      recipe.voteCount ??
      recipe.vote_count ??
      0
    ) || 0;

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

  const authorName =
    recipe.createdBy?.name || recipe.author || "Savorly";

  return (
    <div className="recipe-details-page">
      <Header />

      {notification && (
        <NotificationCard
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {showDeleteConfirm && (
        <div
          className="confirm-overlay"
          onClick={() => {
            if (!deleteLoading) setShowDeleteConfirm(false);
          }}
        >
          <div
            className="confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-icon">!</div>

            <h2 id="delete-confirm-title">Delete this recipe?</h2>

            <p>
              Are you sure you want to delete "{recipe.name}"?
              This action cannot be undone.
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel"
                disabled={deleteLoading}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                disabled={deleteLoading}
                onClick={handleDelete}
              >
                {deleteLoading ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="recipe-details-container">
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

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
                  Math.min(Math.max(Math.round(averageRatingNumber), 0), 5)
                )}
                <span>
                  {"★".repeat(
                    5 -
                    Math.min(Math.max(Math.round(averageRatingNumber), 0), 5)
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
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteLoading}
                  >
                    🗑 Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

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

        <section className="recipe-main-grid">
          <div className="recipe-section">
            <span className="section-eyebrow">WHAT YOU NEED</span>
            <h2>Ingredients</h2>

            {ingredients.length > 0 ? (
              <div className="ingredients-list">
                {ingredients.map((ingredient, index) => (
                  <label
                    className="ingredient-item"
                    key={`${String(
                      typeof ingredient === "object"
                        ? ingredient.name || ingredient.ingredient || index
                        : ingredient
                    )}-${index}`}
                  >
                    <input type="checkbox" />

                    <span className="ingredient-checkbox">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>

                    <span className="ingredient-text">
                      {typeof ingredient === "object"
                        ? ingredient.name ||
                          ingredient.ingredient ||
                          JSON.stringify(ingredient)
                        : ingredient}
                    </span>
                  </label>
                ))}
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
                  <div
                    className="step-item"
                    key={`${String(step)}-${index}`}
                  >
                    <span className="step-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p>
                      {typeof step === "object"
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

function NotificationCard({ notification, onClose }) {
  const isSuccess = notification.type === "success";

  return (
    <div
      key={notification.id}
      className={`custom-notification ${
        isSuccess ? "success" : "error"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="notification-icon">
        {isSuccess ? "✓" : "!"}
      </span>

      <div className="notification-content">
        <strong>{isSuccess ? "Success" : "Something went wrong"}</strong>
        <p>{notification.message}</p>
      </div>

      <button
        type="button"
        className="notification-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export default RecipeDetails;
