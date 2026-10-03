import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getFavorites } from "../services/favoriteApi";
import RecipeCard from "../components/RecipeCard";

function Favorites() {
  const navigate = useNavigate();

  const { isLoggedIn } = useSelector((state) => state.auth);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getFavorites();

        setRecipes(data.favorites || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="favorites-page">
        <h1>My Favorites</h1>
        <p>Loading your favorites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-page">
        <h1>My Favorites</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <button className="back-button" onClick={() => navigate("/")}>
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

          <button onClick={() => navigate("/")}>Explore Recipes</button>
        </div>
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
