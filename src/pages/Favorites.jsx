import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getFavorites } from "../services/favoriteApi";
import RecipeCard from "../components/RecipeCard";
import Header from "../components/Header";
import { useNotification } from "../context/NotificationContext";

function Favorites() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const { isLoggedIn } = useSelector((state) => state.auth);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      notify("Please sign in to view your favorite recipes.", "warning");
      navigate("/login");
      return;
    }

    let active = true;

    const loadFavorites = async () => {
      try {
        setLoading(true);

        const data = await getFavorites();

        if (!active) return;

        setRecipes(data.favorites || []);
      } catch (error) {
        if (!active) return;

        notify(
          error.message || "Failed to load your favorite recipes.",
          "error"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadFavorites();

    return () => {
      active = false;
    };
  }, [isLoggedIn, navigate, notify]);

  return (
    <>
      <Header />

      <div className="favorites-page">
        {loading ? (
          <div className="favorites-loading">
            <h1>My Favorites</h1>
            <p>Loading your favorites...</p>
          </div>
        ) : (
          <>
            <div className="favorites-header">
              <button
                type="button"
                className="back-button"
                onClick={() => navigate("/")}
              >
                ← Back
              </button>

              <h1>My Favorites</h1>

              <p>Your saved recipes in one place.</p>
            </div>

            {recipes.length === 0 ? (
              <div className="empty-favorites">
                <div className="empty-heart">♡</div>

                <h2>No favorites yet</h2>

                <p>Start saving recipes you love.</p>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                >
                  Explore Recipes
                </button>
              </div>
            ) : (
              <div className="recipes-grid">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe._id}
                    recipe={recipe}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Favorites;

