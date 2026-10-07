import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";

import { getMyRecipes, getUserRecipes } from "../services/recipeApi";

function Community() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [activeTab, setActiveTab] = useState("my");

  const [myRecipes, setMyRecipes] = useState([]);

  const [userRecipes, setUserRecipes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const loadRecipes = async () => {
      try {
        setLoading(true);
        setError("");

        const [myResult, userResult] = await Promise.all([
          getMyRecipes(),
          getUserRecipes(),
        ]);

        setMyRecipes(Array.isArray(myResult) ? myResult : []);

        setUserRecipes(Array.isArray(userResult) ? userResult : []);
      } catch (loadError) {
        console.error(loadError);

        setError(loadError.message || "Failed to load community recipes.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const activeRecipes = activeTab === "my" ? myRecipes : userRecipes;

  return (
    <div className="community-page">
      <Header />

      <main className="community-container">
        <section className="community-hero">
          <div>
            <span>SAVORLY COMMUNITY</span>

            <h1>
              Recipes made by
              <br />
              <em>real people.</em>
            </h1>

            <p>
              Share your favorite dishes, discover new ideas and inspire other
              food lovers.
            </p>
          </div>

          <button
            type="button"
            className="community-create-button"
            onClick={() => navigate("/create-recipe")}
          >
            + Create Recipe
          </button>
        </section>

        <div className="community-tabs">
          <button
            type="button"
            className={
              activeTab === "my" ? "community-tab active" : "community-tab"
            }
            onClick={() => setActiveTab("my")}
          >
            👨‍🍳 My Recipes
            <span>{myRecipes.length}</span>
          </button>

          <button
            type="button"
            className={
              activeTab === "users" ? "community-tab active" : "community-tab"
            }
            onClick={() => setActiveTab("users")}
          >
            🌎 User Recipes
            <span>{userRecipes.length}</span>
          </button>
        </div>

        {error && <div className="community-error">{error}</div>}

        {loading ? (
          <div className="community-loading">
            <div className="loading-spinner" />
            <p>Loading community recipes...</p>
          </div>
        ) : activeRecipes.length === 0 ? (
          <div className="community-empty">
            <span>🍳</span>

            <h2>
              {activeTab === "my"
                ? "No recipes yet"
                : "No community recipes yet"}
            </h2>

            <p>
              {activeTab === "my"
                ? "Create your first recipe and share it with the Savorly community."
                : "Be the first to discover and share something delicious."}
            </p>

            {activeTab === "my" && (
              <button type="button" onClick={() => navigate("/create-recipe")}>
                Create Your First Recipe
              </button>
            )}
          </div>
        ) : (
          <section className="community-recipe-grid">
            {activeRecipes.map((recipe) => (
              <RecipeCard key={recipe._id || recipe.id} recipe={recipe} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Community;
