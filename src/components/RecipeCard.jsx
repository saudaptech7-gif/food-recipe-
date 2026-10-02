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

  const isFavorite = favorites.includes(recipe.id);

  const handleFavorite = async (e) => {
    e.stopPropagation();

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(recipe.id);

        dispatch(removeFavoriteFromState(recipe.id));
      } else {
        await addFavorite(recipe.id);

        dispatch(addFavoriteToState(recipe.id));
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <article
      className="recipe-card"
      onClick={() => navigate(`/recipe/${recipe.id}`)}
    >
      <div className="recipe-image-wrapper">
        <img
          className="recipe-image"
          src={recipe.image}
          alt={recipe.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/fallback.jpg";
          }}
        />

        <div className="recipe-category-badge">{recipe.mainCategory}</div>

        <button
          className={`favorite-button ${isFavorite ? "favorite-active" : ""}`}
          onClick={handleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="recipe-content">
        <div className="recipe-rating">
          <span>★</span>

          <strong>{recipe.rating || "N/A"}</strong>

          {recipe.voteCount && <small>({recipe.voteCount})</small>}
        </div>

        <h2>{recipe.name}</h2>

        <p className="recipe-description">{recipe.description}</p>

        <div className="recipe-card-footer">
          <div className="recipe-meta">
            <span>⏱</span>
            {recipe.times?.preparation || "—"}
          </div>

          <div className="recipe-meta">
            <span>👥</span>
            {recipe.serves || "—"}
          </div>

          <div className="recipe-meta">
            <span>●</span>
            {recipe.difficulty || "Easy"}
          </div>
        </div>
      </div>
    </article>
  );
}

export default RecipeCard;
