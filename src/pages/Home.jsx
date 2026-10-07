/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import RecipeCard from "../components/RecipeCard";

import {
  getRecipes,
  getMyRecipes,
  getUserRecipes,
} from "../services/recipeApi";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  // =====================================
  // STATES
  // =====================================

  const [recipes, setRecipes] = useState([]);

  const [myRecipes, setMyRecipes] = useState([]);

  const [userRecipes, setUserRecipes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [communityLoading, setCommunityLoading] = useState(false);

  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    category: location.state?.category || "",
    search: "",
    difficulty: "",
    subcategory: "",
    dishType: "",
  });

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  // =====================================
  // LOAD ARCHIVE RECIPES
  // =====================================

  const loadArchiveRecipes = async (currentFilters, currentPage) => {
    try {
      setLoading(true);

      setError("");

      const data = await getRecipes({
        ...currentFilters,

        recipeType: "archive",

        page: currentPage,

        limit: 6,
      });

      // Backend already handles nutrition filtering.
      // Do NOT filter recipes again here.

      setRecipes(data.recipes || []);

      setTotalPages(data.totalPages || 1);
    } catch (loadError) {
      console.error("Archive recipes error:", loadError);

      setError(loadError.message || "Failed to fetch recipes.");

      setRecipes([]);

      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // LOAD COMMUNITY RECIPES
  // =====================================

  const loadCommunityRecipes = async () => {
    if (!isLoggedIn) {
      setMyRecipes([]);

      setUserRecipes([]);

      return;
    }

    try {
      setCommunityLoading(true);

      const [myResult, userResult] = await Promise.all([
        getMyRecipes(),
        getUserRecipes(),
      ]);

      setMyRecipes(Array.isArray(myResult) ? myResult : []);

      setUserRecipes(Array.isArray(userResult) ? userResult : []);
    } catch (loadError) {
      console.error("Community home error:", loadError);

      setMyRecipes([]);

      setUserRecipes([]);
    } finally {
      setCommunityLoading(false);
    }
  };

  // =====================================
  // ARCHIVE RECIPES EFFECT
  // =====================================

  useEffect(() => {
    loadArchiveRecipes(filters, page);
  }, [filters, page]);

  // =====================================
  // COMMUNITY RECIPES EFFECT
  // =====================================

  useEffect(() => {
    loadCommunityRecipes();
  }, [isLoggedIn]);

  // =====================================
  // CATEGORY FROM HEADER
  // =====================================

  useEffect(() => {
    const category = location.state?.category;

    if (category !== undefined && category !== filters.category) {
      setFilters((previous) => ({
        ...previous,
        category,
      }));

      setPage(1);

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // =====================================
  // CATEGORY CHANGE
  // =====================================

  const handleCategoryChange = (category) => {
    setFilters((previous) => ({
      ...previous,
      category,
    }));

    setPage(1);
  };

  // =====================================
  // SEARCH
  // =====================================

  const handleSearch = (search) => {
    setFilters((previous) => ({
      ...previous,
      search,
    }));

    setPage(1);
  };

  // =====================================
  // FILTER CHANGE
  // =====================================

  const handleFiltersChange = (newFilters) => {
    setFilters((previous) => ({
      ...previous,
      ...newFilters,
    }));

    setPage(1);
  };

  // =====================================
  // CLEAR FILTERS
  // =====================================

  const clearFilters = () => {
    setFilters({
      category: "",
      search: "",
      difficulty: "",
      subcategory: "",
      dishType: "",
    });

    setPage(1);
  };

  // =====================================
  // PAGINATION
  // =====================================

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((previous) => previous - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((previous) => previous + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="home-page">
      <Header onCategoryChange={handleCategoryChange} />

      <main>
        {/* =================================
            HERO
        ================================= */}

        <section className="home-hero">
          <div className="home-hero-content">
            <span className="home-hero-eyebrow">WELCOME TO SAVORLY</span>

            <h1>
              Discover recipes
              <br />
              worth sharing.
            </h1>

            <p>
              Explore delicious recipes, discover new flavours and share your
              own creations with the Savorly community.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/community")}
            >
              Explore Community
            </button>
          </div>

          <div className="hero-food-art">
            <div className="hero-food-circle">🍲</div>
          </div>
        </section>

        {/* =================================
            SEARCH + FILTERS
        ================================= */}

        <section className="recipe-discovery-section">
          <SearchBar onSearch={handleSearch} />

          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={clearFilters}
          />
        </section>

        {/* =================================
            OUR RECIPES
        ================================= */}

        <section id="our-recipes" className="home-recipe-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">SAVORLY COLLECTION</span>

              <h2>Our Recipes</h2>

              <p>Carefully selected recipes from our archive.</p>
            </div>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="recipe-loading">
              <div className="loading-spinner"></div>

              <p>Discovering delicious recipes...</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="recipe-error">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => loadArchiveRecipes(filters, page)}
              >
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && recipes.length === 0 && (
            <div className="recipe-empty">
              <div className="recipe-empty-icon">🍽️</div>

              <h3>No recipes found</h3>

              <p>Try changing your search or filters.</p>

              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}

          {/* RECIPE GRID */}

          {!loading && !error && recipes.length > 0 && (
            <>
              <div className="home-recipe-grid">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe._id || recipe.id} recipe={recipe} />
                ))}
              </div>

              {/* PAGINATION */}

              {totalPages > 1 && (
                <div className="recipe-pagination">
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                  >
                    ← Previous
                  </button>

                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* =================================
            MY RECIPES
        ================================= */}

        {isLoggedIn && (
          <section className="home-recipe-section community-home-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">YOUR COLLECTION</span>

                <h2>My Recipes</h2>

                <p>Recipes you have created on Savorly.</p>
              </div>

              <button
                type="button"
                className="section-action-button"
                onClick={() => navigate("/community")}
              >
                View All
              </button>
            </div>

            {communityLoading ? (
              <div className="recipe-loading">
                <div className="loading-spinner"></div>

                <p>Loading your recipes...</p>
              </div>
            ) : myRecipes.length === 0 ? (
              <div className="recipe-empty compact">
                <div className="recipe-empty-icon">👨‍🍳</div>

                <h3>No recipes yet</h3>

                <p>Create your first recipe and share it with the community.</p>

                <button
                  type="button"
                  onClick={() => navigate("/create-recipe")}
                >
                  Create Recipe
                </button>
              </div>
            ) : (
              <div className="home-recipe-grid">
                {myRecipes.slice(0, 6).map((recipe) => (
                  <RecipeCard key={recipe._id || recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* =================================
            USER RECIPES
        ================================= */}

        {isLoggedIn && (
          <section className="home-recipe-section community-home-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">COMMUNITY</span>

                <h2>User Recipes</h2>

                <p>Discover recipes created by the Savorly community.</p>
              </div>

              <button
                type="button"
                className="section-action-button"
                onClick={() => navigate("/community")}
              >
                View All
              </button>
            </div>

            {communityLoading ? (
              <div className="recipe-loading">
                <div className="loading-spinner"></div>

                <p>Loading community recipes...</p>
              </div>
            ) : userRecipes.length === 0 ? (
              <div className="recipe-empty compact">
                <div className="recipe-empty-icon">🌎</div>

                <h3>No community recipes</h3>

                <p>Be the first to share your recipe.</p>
              </div>
            ) : (
              <div className="home-recipe-grid">
                {userRecipes.slice(0, 6).map((recipe) => (
                  <RecipeCard key={recipe._id || recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Home;
