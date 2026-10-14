/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getRecipes,
  getMyRecipes,
  getUserRecipes,
} from "../services/recipeApi";

import {
  setRecipes,
  setPagination,
  setLoading,
  setError,
  setFilters,
} from "../redux/recipeSlice";

import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import Footer from "../components/Footer";
import Loading from "../components/Loading";

// =====================================
// NORMALIZE API RESPONSE
// =====================================

function extractRecipes(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return { recipes: payload, meta: {} };
  }

  const possibleLists = [
    payload?.recipes,
    payload?.data?.recipes,
    payload?.results,
    payload?.items,
    payload?.data,
  ];

  return {
    recipes: possibleLists.find(Array.isArray) || [],
    meta: payload?.pagination || payload?.data?.pagination || payload || {},
  };
}

function normalizeRecipeList(response) {
  return extractRecipes(response).recipes;
}

// =====================================
// NUTRITION CHECK
// Archive recipes without nutrition are hidden.
// =====================================

function hasNutritionData(recipe) {
  const nutrition =
    recipe?.nutrients ?? recipe?.nutrition ?? recipe?.nutritionalInfo;

  if (
    nutrition === undefined ||
    nutrition === null ||
    typeof nutrition !== "object"
  ) {
    return false;
  }

  const values = Array.isArray(nutrition)
    ? nutrition
    : Object.values(nutrition);

  return values.some((value) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "object") {
      return Object.values(value).some(
        (nested) =>
          nested !== null &&
          nested !== undefined &&
          String(nested).trim() !== "",
      );
    }

    return String(value).trim() !== "";
  });
}

// =====================================
// HOME PAGE
// =====================================

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [homeTab, setHomeTab] = useState("our");

  const [myRecipes, setMyRecipes] = useState([]);
  const [userRecipes, setUserRecipes] = useState([]);

  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");

  // =====================================
  // REDUX STATE
  // =====================================

  const recipesState = useSelector((state) => state.recipes);

  const recipes = Array.isArray(recipesState?.recipes)
    ? recipesState.recipes
    : [];

  const loading = recipesState?.loading || false;
  const error = recipesState?.error || null;

  const filters = recipesState?.filters || {
    category: "",
    search: "",
    difficulty: "",
    subcategory: "",
    dishType: "",
  };

  const pagination = recipesState?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalRecipes: 0,
  };

  const visibleRecipes = recipes.filter(hasNutritionData);

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  // =====================================
  // FETCH ARCHIVE RECIPES
  // =====================================

  const fetchRecipes = async (currentFilters, page = 1) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getRecipes({
        ...currentFilters,
        recipeType: "archive",
        page,
        limit: 9,
      });

      const result = extractRecipes(response);
      const meta = result.meta;

      dispatch(setRecipes(result.recipes));

      dispatch(
        setPagination({
          currentPage: Number(meta.currentPage ?? meta.page) || page,

          totalPages: Number(meta.totalPages ?? meta.pages) || 1,

          totalRecipes:
            Number(meta.totalRecipes ?? meta.total) || result.recipes.length,
        }),
      );
    } catch (fetchError) {
      console.error("Failed to fetch archive recipes:", fetchError);

      dispatch(setError(fetchError.message || "Failed to load recipes."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Initial archive fetch

  useEffect(() => {
    fetchRecipes(filters, 1);
  }, []);

  // =====================================
  // FETCH COMMUNITY RECIPES
  // =====================================

  useEffect(() => {
    let cancelled = false;

    const loadCommunityRecipes = async () => {
      if (!isLoggedIn) {
        setMyRecipes([]);
        setUserRecipes([]);
        setCommunityError("");
        setCommunityLoading(false);
        return;
      }

      setCommunityLoading(true);
      setCommunityError("");

      try {
        const [myResponse, usersResponse] = await Promise.all([
          getMyRecipes(),
          getUserRecipes(),
        ]);

        if (cancelled) return;

        setMyRecipes(normalizeRecipeList(myResponse));
        setUserRecipes(normalizeRecipeList(usersResponse));
      } catch (fetchError) {
        if (!cancelled) {
          console.error("Failed to load community recipes:", fetchError);

          setCommunityError(
            fetchError.message || "Unable to load community recipes.",
          );
        }
      } finally {
        if (!cancelled) {
          setCommunityLoading(false);
        }
      }
    };

    loadCommunityRecipes();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // =====================================
  // SCROLL TO COLLECTIONS
  // =====================================

  const scrollToCollections = () => {
    window.setTimeout(() => {
      document.querySelector(".home-collections-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // =====================================
  // CATEGORY CHANGE
  // =====================================

  const handleCategoryChange = (category) => {
    const newFilters = {
      ...filters,
      category,
    };

    setHomeTab("our");
    dispatch(setFilters(newFilters));
    fetchRecipes(newFilters, 1);
    scrollToCollections();
  };

  // =====================================
  // SEARCH
  // =====================================

  const handleSearch = (search) => {
    const newFilters = {
      ...filters,
      search,
    };

    dispatch(setFilters(newFilters));
    fetchRecipes(newFilters, 1);
  };

  // =====================================
  // FILTERS
  // =====================================

  const handleFilterChange = (newFilterValues) => {
    const newFilters = {
      ...filters,
      ...newFilterValues,
    };

    dispatch(setFilters(newFilters));
    fetchRecipes(newFilters, 1);
  };

  const handleClearFilters = () => {
    const newFilters = {
      ...filters,
      difficulty: "",
      subcategory: "",
      dishType: "",
    };

    dispatch(setFilters(newFilters));
    fetchRecipes(newFilters, 1);
  };

  // =====================================
  // PAGINATION
  // =====================================

  const handlePageChange = (page) => {
    fetchRecipes(filters, page);
    scrollToCollections();
  };

  // =====================================
  // HERO BUTTON
  // =====================================

  const handleExploreRecipes = () => {
    setHomeTab("our");
    scrollToCollections();
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="home-page">
      <Header onCategoryChange={handleCategoryChange} />

      {/* PREMIUM FOOD IMAGE HERO */}

      <section className="hero-scroll-section">
        <div className="hero-sticky">
          <section className="hero-section">
            {/* LEFT SIDE: HERO CONTENT */}

            <div className="hero-content">
              <span className="hero-badge">
                <span aria-hidden="true">✦</span>
                Discover • Cook • Enjoy
              </span>

              <h1>
                Delicious recipes,
                <br />
                made for <span>you.</span>
              </h1>

              <p>
                Explore delicious recipes for baking, healthy meals, quick
                budgets and everyday inspiration. Find your next favourite dish
                with Savorly.
              </p>

              <button
                type="button"
                className="hero-button"
                onClick={handleExploreRecipes}
              >
                Explore Recipes <span>→</span>
              </button>

              <div className="hero-trust-row">
                <span className="hero-trust-icon">♥</span>
                <span>Made for food lovers, shared with love.</span>
              </div>
            </div>

            {/* RIGHT SIDE: FOOD IMAGE AND FLOATING INGREDIENTS */}

            <div className="hero-food-visual">
              <div className="hero-food-glow" />

              <span
                className="hero-floating-ingredient ingredient-tomato"
                aria-hidden="true"
              >
                🍅
              </span>

              <span
                className="hero-floating-ingredient ingredient-leaf"
                aria-hidden="true"
              >
                🌿
              </span>

              <span
                className="hero-floating-ingredient ingredient-pasta"
                aria-hidden="true"
              >
                🍝
              </span>

              <span
                className="hero-floating-ingredient ingredient-herb"
                aria-hidden="true"
              >
                🌱
              </span>

              <span
                className="hero-floating-ingredient ingredient-pepper"
                aria-hidden="true"
              >
                🫑
              </span>

              <div className="hero-food-image-wrap">
                <img
                  className="hero-food-image"
                  src="./public/images/savorly-hero-food.jpg"
                  alt="A delicious 3D cartoon food dish with fresh ingredients"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="hero-food-caption">
                <span className="hero-caption-icon">✦</span>

                <div>
                  <strong>Made with love</strong>
                  <span>Fresh ideas, delicious moments</span>
                </div>
              </div>

              <div className="hero-floating-note">
                <span>🥗</span>
                <div>
                  <strong>Fresh & delicious</strong>
                  <small>Everyday inspiration</small>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* RECIPE COLLECTIONS */}

      <section className="home-collections-section">
        <div className="home-section-intro">
          <span className="home-section-eyebrow">
            DISCOVER YOUR NEXT FAVORITE
          </span>

          <h2>
            Explore Our <span>Recipes</span>
          </h2>

          <p>
            From everyday meals to special treats, discover delicious ideas for
            every occasion.
          </p>

          <div className="home-section-divider">
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* COLLECTION TABS */}

        <div
          className="home-collection-tabs"
          role="tablist"
          aria-label="Recipe collections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={homeTab === "our"}
            className={`home-collection-tab ${
              homeTab === "our" ? "active" : ""
            }`}
            onClick={() => setHomeTab("our")}
          >
            <span className="home-tab-icon">🍽️</span>
            <span>Our Recipes</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={homeTab === "my"}
            className={`home-collection-tab ${
              homeTab === "my" ? "active" : ""
            }`}
            onClick={() => setHomeTab("my")}
          >
            <span className="home-tab-icon">👨‍🍳</span>
            <span>My Recipes</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={homeTab === "users"}
            className={`home-collection-tab ${
              homeTab === "users" ? "active" : ""
            }`}
            onClick={() => setHomeTab("users")}
          >
            <span className="home-tab-icon">🌎</span>
            <span>User Recipes</span>
          </button>
        </div>

        {/* OUR RECIPES */}

        {homeTab === "our" && (
          <section className="recipes-section home-tab-content" role="tabpanel">
            <div className="section-heading">
              <div>
                <span>HANDPICKED FOR YOU</span>
                <h2>Our Recipes</h2>
              </div>

              <p>
                Delicious ideas, inspiring flavors, and meals worth sharing.
              </p>
            </div>

            <SearchBar onSearch={handleSearch} />

            <FilterBar
              difficulty={filters.difficulty}
              subcategory={filters.subcategory}
              dishType={filters.dishType}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />

            {loading && (
              <div className="recipes-loading">
                <Loading />
              </div>
            )}

            {error && (
              <div className="recipe-error">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {visibleRecipes.length > 0 ? (
                  <div className="recipes-grid">
                    {visibleRecipes.map((recipe, index) => (
                      <RecipeCard
                        key={recipe._id || recipe.id || recipe.url || index}
                        recipe={recipe}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-recipes">
                    <h3>No recipes found</h3>
                    <p>Try changing your search or filters.</p>
                  </div>
                )}

                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      disabled={pagination.currentPage === 1}
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                    >
                      ← Previous
                    </button>

                    <span>
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* MY RECIPES */}

        {homeTab === "my" && (
          <section
            className="community-subsection home-tab-content"
            role="tabpanel"
          >
            <div className="community-subsection-heading home-tab-heading">
              <div>
                <span>YOUR CREATIONS</span>
                <h2>My Recipes</h2>
                <p>All the delicious recipes you have created.</p>
              </div>

              {isLoggedIn && (
                <button
                  type="button"
                  className="create-recipe-button"
                  onClick={() => navigate("/create-recipe")}
                >
                  + Create Recipe
                </button>
              )}
            </div>

            {!isLoggedIn ? (
              <div className="empty-recipes home-community-message">
                <h3>Sign in to see your recipes</h3>
                <p>Log in to create and manage your own recipes.</p>

                <button
                  type="button"
                  className="create-recipe-button"
                  onClick={() => navigate("/login")}
                >
                  Login to Continue →
                </button>
              </div>
            ) : communityLoading ? (
              <div className="recipes-loading">
                <Loading />
              </div>
            ) : communityError ? (
              <div className="recipe-error">
                <p>{communityError}</p>
              </div>
            ) : myRecipes.length > 0 ? (
              <>
                <div className="recipes-grid">
                  {myRecipes.slice(0, 3).map((recipe, index) => (
                    <RecipeCard
                      key={recipe._id || recipe.id || index}
                      recipe={recipe}
                    />
                  ))}
                </div>

                <div className="home-view-all">
                  <button
                    type="button"
                    className="home-view-all-button"
                    onClick={() => navigate("/community?tab=my")}
                  >
                    View All My Recipes →
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-recipes home-community-message">
                <h3>Your collection starts here</h3>
                <p>Share your favourite dish by creating your first recipe.</p>

                <button
                  type="button"
                  className="create-recipe-button"
                  onClick={() => navigate("/create-recipe")}
                >
                  + Create Your First Recipe
                </button>
              </div>
            )}
          </section>
        )}

        {/* USER RECIPES */}

        {homeTab === "users" && (
          <section
            className="community-subsection home-tab-content user-recipes-tab"
            role="tabpanel"
          >
            <div className="community-subsection-heading home-tab-heading">
              <div>
                <span>FROM OUR COMMUNITY</span>
                <h2>User Recipes</h2>
                <p>Discover recipes shared by other home chefs.</p>
              </div>

              {isLoggedIn && (
                <button
                  type="button"
                  className="create-recipe-button"
                  onClick={() => navigate("/create-recipe")}
                >
                  + Share a Recipe
                </button>
              )}
            </div>

            {!isLoggedIn ? (
              <div className="empty-recipes home-community-message">
                <h3>Join the Savorly community</h3>
                <p>
                  Log in to explore community recipes and share your own
                  creations.
                </p>

                <button
                  type="button"
                  className="create-recipe-button"
                  onClick={() => navigate("/login")}
                >
                  Login to Continue →
                </button>
              </div>
            ) : communityLoading ? (
              <div className="recipes-loading">
                <Loading />
              </div>
            ) : communityError ? (
              <div className="recipe-error">
                <p>{communityError}</p>
              </div>
            ) : userRecipes.length > 0 ? (
              <>
                <div className="recipes-grid">
                  {userRecipes.slice(0, 3).map((recipe, index) => (
                    <RecipeCard
                      key={recipe._id || recipe.id || index}
                      recipe={recipe}
                    />
                  ))}
                </div>

                <div className="home-view-all">
                  <button
                    type="button"
                    className="home-view-all-button"
                    onClick={() => navigate("/community?tab=users")}
                  >
                    View All User Recipes →
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-recipes home-community-message">
                <h3>No community recipes yet</h3>
                <p>Be one of the first chefs to share a recipe.</p>

                <button
                  type="button"
                  className="create-recipe-button"
                  onClick={() => navigate("/create-recipe")}
                >
                  + Share a Recipe
                </button>
              </div>
            )}
          </section>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default Home;
