/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";
import { getLikedRecipes } from "../services/socialApi";
import { useNotification } from "../context/NotificationContext";

function LikedRecipes() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const loadRecipes = useCallback(async () => {
    let active = true;

    setLoading(true);
    setError("");

    try {
      const result = await getLikedRecipes();

      const list = Array.isArray(result)
        ? result
        : result?.recipes || result?.data?.recipes || [];

      setRecipes(list);
    } catch (err) {
      if (err?.status === 401) {
        notify("Please sign in to view your liked recipes.", "warning");

        navigate("/login", { replace: true });
        return;
      }

      const errorMessage = err?.message || "Could not load liked recipes.";

      setError(errorMessage);
      notify(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [navigate, notify]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes, retry]);

  return (
    <div className="liked-recipes-page">
      <Header />

      <main className="liked-recipes-container">
        <button
          type="button"
          className="liked-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <header className="liked-recipes-heading">
          <span className="liked-recipes-eyebrow">YOUR COMMUNITY ACTIVITY</span>

          <h1>Liked Recipes ❤️</h1>

          <p>
            Community recipes you have liked appear here. Your saved Favorites
            are kept in a separate collection.
          </p>
        </header>

        {loading ? (
          <section className="liked-recipes-state">
            <div className="loading-spinner" />
            <p>Loading your liked recipes...</p>
          </section>
        ) : error ? (
          <section className="liked-recipes-state">
            <h2>Unable to load recipes</h2>

            <p>Something went wrong while loading your recipes.</p>

            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try Again
            </button>
          </section>
        ) : recipes.length === 0 ? (
          <section className="liked-recipes-state">
            <div className="liked-recipes-empty-icon">♡</div>

            <h2>No liked recipes yet</h2>

            <p>
              Explore the community and like recipes you want to find again.
            </p>

            <button type="button" onClick={() => navigate("/community")}>
              Explore Community
            </button>
          </section>
        ) : (
          <div className="liked-recipes-grid">
            {recipes.map((recipe, index) => (
              <RecipeCard
                key={recipe._id || recipe.id || `liked-recipe-${index}`}
                recipe={recipe}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default LikedRecipes;
