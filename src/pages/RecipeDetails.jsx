import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { getRecipeById } from "../services/recipeApi";
import { addFavorite, removeFavorite } from "../services/favoriteApi";

import {
  addFavoriteToState,
  removeFavoriteFromState,
} from "../redux/favoriteSlice";

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoggedIn } = useSelector((state) => state.auth);
  const favorites = useSelector((state) => state.favorites.favorites);

  const isFavorite = favorites.includes(id);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");

  // Fetch recipe details
  useEffect(() => {
    let active = true;

    const fetchRecipe = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getRecipeById(id);

        if (active) {
          setRecipe(data);
          setCheckedIngredients([]);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load recipe.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchRecipe();

    return () => {
      active = false;
    };
  }, [id]);

  // Check or uncheck an ingredient
  const toggleIngredient = (index) => {
    setCheckedIngredients((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };

  // Add or remove recipe from favorites
  const handleFavorite = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      setFavoriteLoading(true);
      setFavoriteMessage("");

      if (isFavorite) {
        await removeFavorite(id);

        dispatch(removeFavoriteFromState(id));

        setFavoriteMessage("Removed from your favorites.");
      } else {
        await addFavorite(id);

        dispatch(addFavoriteToState(id));

        setFavoriteMessage("Added to your favorites!");
      }
    } catch (err) {
      setFavoriteMessage(err.message || "Could not update favorites.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main className="recipe-details-loading">
        <div className="loading-spinner" />
        <p>Preparing your recipe...</p>
      </main>
    );
  }

  // Error screen
  if (error || !recipe) {
    return (
      <main className="recipe-details-state">
        <div className="details-state-icon">🍽️</div>

        <h1>Recipe unavailable</h1>

        <p>{error || "We couldn't find this recipe."}</p>

        <button className="details-primary-button" onClick={() => navigate(-1)}>
          ← Go Back
        </button>
      </main>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  const nutrients = recipe.nutrients || {};

  const nutritionItems = [
    ["Calories", nutrients.kcal, "kcal"],
    ["Fat", nutrients.fat, ""],
    ["Carbohydrates", nutrients.carbs, ""],
    ["Protein", nutrients.protein, ""],
    ["Fibre", nutrients.fibre, ""],
    ["Salt", nutrients.salt, ""],
  ];

  return (
    <main className="recipe-details-page recipe-details-premium">
      <button className="back-button" onClick={() => navigate(-1)}>
        <span aria-hidden="true">←</span>
        Back to recipes
      </button>

      <article className="recipe-details">
        {/* Recipe image and summary */}
        <section className="recipe-details-top">
          <div className="recipe-details-photo-wrap">
            <img
              className="recipe-details-image"
              src={recipe.image}
              alt={recipe.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/fallback.jpg";
              }}
            />

            <span className="details-image-badge">
              {recipe.mainCategory || "Recipe"}
            </span>
          </div>

          <div className="recipe-details-summary">
            <p className="recipe-category">
              {recipe.subcategory || recipe.mainCategory || "Recipe collection"}
            </p>

            <h1>{recipe.name}</h1>

            <p className="recipe-details-description">
              {recipe.description || "A delicious recipe to try at home."}
            </p>

            <div className="details-rating-line">
              <span className="details-stars">★</span>

              <strong>{recipe.rating || "N/A"}</strong>

              {recipe.voteCount ? (
                <span className="details-votes">
                  ({recipe.voteCount} ratings)
                </span>
              ) : null}
            </div>

            <div className="recipe-details-info">
              <span>◷ {recipe.difficulty || "Difficulty not listed"}</span>

              <span>♧ Serves {recipe.serves || "N/A"}</span>
            </div>

            {/* Preparation and cooking time */}
            <div className="recipe-time">
              <div>
                <span className="details-time-icon">⌚</span>

                <div>
                  <strong>Preparation</strong>
                  <span>{recipe.times?.preparation || "N/A"}</span>
                </div>
              </div>

              <div>
                <span className="details-time-icon">♨</span>

                <div>
                  <strong>Cooking</strong>
                  <span>{recipe.times?.cooking || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Favorite button */}
            <button
              type="button"
              className={`details-favorite-button ${
                isFavorite ? "is-favorite" : ""
              }`}
              onClick={handleFavorite}
              disabled={favoriteLoading}
            >
              <span>{isFavorite ? "♥" : "♡"}</span>

              {favoriteLoading
                ? "Updating..."
                : isFavorite
                  ? "Saved to Favorites"
                  : "Save to Favorites"}
            </button>

            {favoriteMessage && (
              <p className="details-favorite-message" role="status">
                {favoriteMessage}
              </p>
            )}
          </div>
        </section>

        <div className="recipe-details-content">
          {/* Ingredients */}
          <section className="details-section">
            <div className="details-section-heading">
              <span className="details-section-icon">🧺</span>

              <div>
                <p>GET EVERYTHING READY</p>
                <h2>Ingredients</h2>
              </div>
            </div>

            <p className="ingredients-progress">
              {checkedIngredients.length} of {ingredients.length} ingredients
              checked
            </p>

            {ingredients.length > 0 ? (
              <ul className="ingredients-list ingredients-checklist">
                {ingredients.map((ingredient, index) => {
                  const checked = checkedIngredients.includes(index);

                  return (
                    <li
                      key={`${index}-${ingredient}`}
                      className={checked ? "ingredient-checked" : ""}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIngredient(index)}
                        />

                        <span
                          className="ingredient-checkmark"
                          aria-hidden="true"
                        >
                          {checked ? "✓" : ""}
                        </span>

                        <span className="ingredient-text">{ingredient}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="details-empty-note">
                No ingredients are listed for this recipe.
              </p>
            )}
          </section>

          {/* Cooking method */}
          <section className="details-section">
            <div className="details-section-heading">
              <span className="details-section-icon">👨‍🍳</span>

              <div>
                <p>LET'S START COOKING</p>
                <h2>Method</h2>
              </div>
            </div>

            {steps.length > 0 ? (
              <ol className="steps-list premium-steps-list">
                {steps.map((step, index) => (
                  <li key={`${index}-${step}`}>
                    <span className="step-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="step-copy">
                      <h3>Step {index + 1}</h3>
                      <p>{step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="details-empty-note">
                No method steps are listed for this recipe.
              </p>
            )}
          </section>

          {/* Nutrition */}
          <section className="details-section nutrition-section">
            <div className="details-section-heading">
              <span className="details-section-icon">🥗</span>

              <div>
                <p>A QUICK NUTRITION OVERVIEW</p>
                <h2>Nutrition</h2>
              </div>
            </div>

            <div className="nutrition-grid premium-nutrition-grid">
              {nutritionItems.map(([label, value, unit]) => (
                <div key={label}>
                  <span>{label}</span>

                  <strong>
                    {value || "N/A"}
                    {value && unit ? ` ${unit}` : ""}
                  </strong>
                </div>
              ))}
            </div>

            <p className="nutrition-disclaimer">
              Nutrition values are shown as provided in the recipe data.
            </p>
          </section>

          {/* Recipe author */}
          {recipe.author && (
            <footer className="recipe-author">
              <span className="author-avatar">✦</span>

              <div>
                <span>Recipe credited to</span>
                <strong>{recipe.author}</strong>
              </div>
            </footer>
          )}
        </div>
      </article>
    </main>
  );
}

export default RecipeDetails;
