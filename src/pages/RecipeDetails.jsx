import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Header from "../components/Header";

import { getRecipeById, rateRecipe, deleteRecipe } from "../services/recipeApi";

import { addFavorite, removeFavorite } from "../services/favoriteApi";

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

  const recipeId = recipe?.id || recipe?._id || id;

  const isCommunityRecipe = recipe?.recipeType === "community";

  const isOwnRecipe = useMemo(() => {
    if (!currentUser || !recipe?.createdBy) {
      return false;
    }

    const currentUserId = currentUser.id || currentUser._id;

    const ownerId =
      recipe.createdBy.id || recipe.createdBy._id || recipe.createdBy;

    return String(currentUserId) === String(ownerId);
  }, [currentUser, recipe]);

  const isFavorite = favorites?.some(
    (item) => String(item._id || item.id) === String(recipeId),
  );

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRecipeById(id);

        setRecipe(data);

        setSelectedRating(Number(data?.userRating || 0));
      } catch (fetchError) {
        console.error(fetchError);

        setError(fetchError.message || "Failed to load recipe.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        await removeFavorite(recipeId);

        dispatch(removeFavorite(recipeId));
      } else {
        await addFavorite(recipeId);

        dispatch(addFavorite(recipe));
      }
    } catch (favoriteError) {
      console.error("Favorite error:", favoriteError);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRating = async (value) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (isOwnRecipe) {
      return;
    }

    try {
      setRatingLoading(true);

      const data = await rateRecipe(recipeId, value);

      setSelectedRating(data.userRating || value);

      setRecipe((previous) => ({
        ...previous,

        averageRating: data.averageRating ?? previous.averageRating,

        ratingCount: data.ratingCount ?? previous.ratingCount,

        rating: data.averageRating ?? previous.rating,

        voteCount: data.ratingCount ?? previous.voteCount,
      }));
    } catch (ratingError) {
      console.error("Rating error:", ratingError);

      alert(ratingError.message || "Failed to save rating.");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwnRecipe) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe?",
    );

    if (!confirmed) {
      return;
    }

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
    recipe.images?.length > 0
      ? recipe.images
      : recipe.image
        ? [recipe.image]
        : ["/fallback.jpg"];

  const nutrients = recipe.nutrients || {};

  const ingredients = recipe.ingredients || [];

  const steps = recipe.steps || [];

  const averageRating = Number(
    recipe.averageRating ?? recipe.rating ?? 0,
  ).toFixed(1);

  const ratingCount = recipe.ratingCount ?? recipe.voteCount ?? 0;

  const category =
    recipe.mainCategory || recipe.category || recipe.subcategory || "Recipe";

  const preparationTime = recipe.times?.preparation || recipe.prepTime || "—";

  const cookingTime = recipe.times?.cooking || recipe.cookTime || "—";

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

        <section className="recipe-hero-details">
          <div className="recipe-image-gallery">
            <img
              src={images[0]}
              alt={recipe.name}
              onError={(event) => {
                event.currentTarget.src = "/fallback.jpg";
              }}
            />

            {images.length > 1 && (
              <div className="recipe-image-count">+{images.length - 1}</div>
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

            <h1>{recipe.name}</h1>

            <p className="recipe-details-description">{recipe.description}</p>

            <div className="recipe-rating-summary">
              <div className="rating-stars-display">
                {"★".repeat(Math.round(Number(averageRating)))}
                <span>{"★".repeat(5 - Math.round(Number(averageRating)))}</span>
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
                <strong>{recipe.servings || recipe.serves || "—"}</strong>
              </div>

              <div>
                <span>LEVEL</span>
                <strong>{recipe.difficulty || "—"}</strong>
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
                {isFavorite ? "♥ Saved" : "♡ Save Recipe"}
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

            <div className="ingredients-list">
              {ingredients.map((ingredient, index) => (
                <label
                  className="ingredient-item"
                  key={`${ingredient}-${index}`}
                >
                  <input type="checkbox" />
                  <span>{ingredient}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="recipe-section">
            <span className="section-eyebrow">LET'S COOK</span>

            <h2>Method</h2>

            <div className="steps-list">
              {steps.map((step, index) => (
                <div className="step-item" key={`${step}-${index}`}>
                  <span className="step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <p>{step}</p>
                </div>
              ))}
            </div>
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
                  {value || "—"}
                  {value ? ` ${unit}` : ""}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <footer className="recipe-author-footer">
          <div className="author-avatar">
            {recipe.createdBy?.name?.charAt(0)?.toUpperCase() ||
              recipe.author?.charAt(0)?.toUpperCase() ||
              "S"}
          </div>

          <div>
            <small>RECIPE BY</small>

            <strong>
              {recipe.createdBy?.name || recipe.author || "Savorly"}
            </strong>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default RecipeDetails;
