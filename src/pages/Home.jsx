
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
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

  const recipes = possibleLists.find(Array.isArray) || [];

  return {
    recipes,
    meta:
      payload?.pagination ||
      payload?.data?.pagination ||
      payload ||
      {},
  };
}

function normalizeRecipeList(response) {
  return extractRecipes(response).recipes;
}

// =====================================
// NUTRITION CHECK
// =====================================

function hasNutritionData(recipe) {
  const nutrition =
    recipe?.nutrients ??
    recipe?.nutrition ??
    recipe?.nutritionalInfo;

  if (nutrition === undefined || nutrition === null) {
    return true;
  }

  if (Array.isArray(nutrition)) {
    return nutrition.some((item) => {
      if (item === null || item === undefined) return false;

      if (typeof item === "object") {
        return Object.values(item).some(
          (value) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== "",
        );
      }

      return String(item).trim() !== "";
    });
  }

  if (typeof nutrition === "object") {
    return Object.values(nutrition).some((value) => {
      if (value === null || value === undefined) return false;

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

  return String(nutrition).trim() !== "";
}

// =====================================
// HOME PAGE
// =====================================

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cookingSceneRef = useRef(null);

  const [cookingProgress, setCookingProgress] = useState(0);
  const [homeTab, setHomeTab] = useState("our");

  const [myRecipes, setMyRecipes] = useState([]);
  const [userRecipes, setUserRecipes] = useState([]);

  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");

  // Redux state

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

  const isLoggedIn = useSelector(
    (state) => state.auth.isLoggedIn,
  );

  // =====================================
  // COOKING SCROLL ANIMATION
  // =====================================

  useEffect(() => {
    const handleScroll = () => {
      const scene = cookingSceneRef.current;
      if (!scene) return;

      const section = scene.closest(".hero-scroll-section");
      if (!section) return;

      const scrollDistance =
        section.offsetHeight - window.innerHeight;

      if (scrollDistance <= 0) return;

      const rect = section.getBoundingClientRect();

      const progress = Math.min(
        Math.max(-rect.top / scrollDistance, 0),
        1,
      );

      setCookingProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
          currentPage:
            Number(meta.currentPage ?? meta.page) || page,
          totalPages:
            Number(meta.totalPages ?? meta.pages) || 1,
          totalRecipes:
            Number(meta.totalRecipes ?? meta.total) ||
            result.recipes.length,
        }),
      );
    } catch (fetchError) {
      console.error(
        "Failed to fetch archive recipes:",
        fetchError,
      );

      dispatch(
        setError(
          fetchError.message || "Failed to load recipes.",
        ),
      );
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
          console.error(
            "Failed to load community recipes:",
            fetchError,
          );

          setCommunityError(
            fetchError.message ||
              "Unable to load community recipes.",
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
      document
        .querySelector(".home-collections-section")
        ?.scrollIntoView({
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

      {/* HERO AND COOKING ANIMATION */}

      <section className="hero-scroll-section">
        <div className="hero-sticky">
          <section className="hero-section">
            <div className="hero-content">
              <span className="hero-badge">
                🍳 Discover • Cook • Enjoy
              </span>

              <h1>
                Delicious recipes,
                <br />
                made for you.
              </h1>

              <p>
                Explore delicious recipes for baking, healthy meals,
                quick budgets and everyday inspiration.
              </p>

              <button
                type="button"
                className="hero-button"
                onClick={handleExploreRecipes}
              >
                Explore Recipes <span>→</span>
              </button>
            </div>

            <div
              className="cooking-scene"
              ref={cookingSceneRef}
            >
              <div
                className="cook-glow"
                style={{
                  opacity: cookingProgress > 0 ? 1 : 0,
                }}
              />

              <div
                className="counter-shadow"
                style={{
                  opacity: cookingProgress > 0.05 ? 1 : 0,
                  transform: `translateX(-50%) scaleX(${
                    0.7 + cookingProgress * 0.3
                  })`,
                }}
              />

              <div
                className="pro-plate"
                style={{
                  opacity: Math.min(cookingProgress / 0.12, 1),
                  transform: `translate(-50%, -50%) scale(${
                    0.72 +
                    Math.min(cookingProgress / 0.12, 1) * 0.28
                  })`,
                }}
              >
                <div className="plate-rim" />
                <div className="plate-center" />
              </div>

              <div
                className="food-item carrot"
                style={{
                  opacity:
                    cookingProgress >= 0.12 &&
                    cookingProgress < 0.72
                      ? 1
                      : 0,
                  transform:
                    cookingProgress >= 0.12 &&
                    cookingProgress < 0.72
                      ? "translate(0,0) rotate(0deg)"
                      : "translate(-60px,-160px) rotate(-35deg)",
                }}
              >
                <span />
              </div>

              <div
                className="food-item tomato"
                style={{
                  opacity:
                    cookingProgress >= 0.18 &&
                    cookingProgress < 0.72
                      ? 1
                      : 0,
                  transform:
                    cookingProgress >= 0.18 &&
                    cookingProgress < 0.72
                      ? "translate(0,0) scale(1)"
                      : "translate(55px,-165px) scale(.55)",
                }}
              >
                <span />
              </div>

              <div
                className="food-item broccoli"
                style={{
                  opacity:
                    cookingProgress >= 0.24 &&
                    cookingProgress < 0.72
                      ? 1
                      : 0,
                  transform:
                    cookingProgress >= 0.24 &&
                    cookingProgress < 0.72
                      ? "translate(0,0) scale(1)"
                      : "translate(-70px,-145px) scale(.55)",
                }}
              >
                <span />
              </div>

              <div
                className="food-item leaf"
                style={{
                  opacity:
                    cookingProgress >= 0.3 &&
                    cookingProgress < 0.72
                      ? 1
                      : 0,
                  transform:
                    cookingProgress >= 0.3 &&
                    cookingProgress < 0.72
                      ? "translate(0,0) rotate(0deg)"
                      : "translate(70px,-150px) rotate(45deg)",
                }}
              >
                <span />
              </div>

              <div
                className="pro-pan"
                style={{
                  opacity:
                    cookingProgress >= 0.3 &&
                    cookingProgress < 0.82
                      ? 1
                      : 0,
                  transform: `translate(-50%,-50%) scale(${
                    cookingProgress >= 0.3 ? 1 : 0.72
                  })`,
                }}
              >
                <div className="pan-inside" />
                <div className="pan-handle" />
              </div>

              <div
                className="pan-food-visual"
                style={{
                  opacity:
                    cookingProgress >= 0.34 &&
                    cookingProgress < 0.78
                      ? 1
                      : 0,
                }}
              >
                <span className="food-dot dot-1" />
                <span className="food-dot dot-2" />
                <span className="food-dot dot-3" />
                <span className="food-dot dot-4" />
                <span className="food-dot dot-5" />
              </div>

              <div
                className="pro-lid"
                style={{
                  opacity:
                    cookingProgress >= 0.4 &&
                    cookingProgress < 0.8
                      ? 1
                      : 0,
                  transform:
                    cookingProgress < 0.4
                      ? "translate(-50%,-220px) rotate(-12deg)"
                      : cookingProgress < 0.7
                        ? "translate(-50%,0) rotate(0deg)"
                        : "translate(-50%,-220px) rotate(12deg)",
                }}
              >
                <div className="lid-top" />
                <div className="lid-handle" />
              </div>

              <div
                className="heat-lines"
                style={{
                  opacity:
                    cookingProgress >= 0.55 &&
                    cookingProgress < 0.72
                      ? 1
                      : 0,
                }}
              >
                <span />
                <span />
                <span />
              </div>

              <div
                className="final-food"
                style={{
                  opacity:
                    cookingProgress >= 0.72
                      ? Math.min(
                          (cookingProgress - 0.72) / 0.1,
                          1,
                        )
                      : 0,
                  transform: `translate(-50%,-50%) scale(${
                    cookingProgress >= 0.72 ? 1 : 0.45
                  })`,
                }}
              >
                <div className="dish-food">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <i />
                  <i />
                </div>
              </div>

              <div
                className="steam"
                style={{
                  opacity:
                    cookingProgress >= 0.84
                      ? Math.min(
                          (cookingProgress - 0.84) / 0.1,
                          1,
                        )
                      : 0,
                }}
              >
                <span />
                <span />
                <span />
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* RECIPE COLLECTIONS */}

      <section className="home-collections-section">
        {/* BEAUTIFUL MAIN HEADING */}

        <div className="home-section-intro">
          <span className="home-section-eyebrow">
            DISCOVER YOUR NEXT FAVORITE
          </span>

          <h2>
            Explore Our <span>Recipes</span>
          </h2>

          <p>
            From everyday meals to special treats, discover delicious
            ideas for every occasion.
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
          <section
            className="recipes-section home-tab-content"
            role="tabpanel"
          >
            <div className="section-heading">
              <div>
                <span>HANDPICKED FOR YOU</span>
                <h2>Our Recipes</h2>
              </div>

              <p>
                Delicious ideas, inspiring flavors, and meals
                worth sharing.
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
                        key={
                          recipe._id ||
                          recipe.id ||
                          recipe.url ||
                          index
                        }
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
                        handlePageChange(
                          pagination.currentPage - 1,
                        )
                      }
                    >
                      ← Previous
                    </button>

                    <span>
                      Page {pagination.currentPage} of{" "}
                      {pagination.totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        pagination.currentPage ===
                        pagination.totalPages
                      }
                      onClick={() =>
                        handlePageChange(
                          pagination.currentPage + 1,
                        )
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
                    onClick={() =>
                      navigate("/community?tab=my")
                    }
                  >
                    View All My Recipes →
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-recipes home-community-message">
                <h3>Your collection starts here</h3>
                <p>
                  Share your favourite dish by creating your first
                  recipe.
                </p>

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
                <p>
                  Discover recipes shared by other home chefs.
                </p>
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
                  Log in to explore community recipes and share your
                  own creations.
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
                    onClick={() =>
                      navigate("/community?tab=users")
                    }
                  >
                    View All User Recipes →
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-recipes home-community-message">
                <h3>No community recipes yet</h3>
                <p>
                  Be one of the first chefs to share a recipe.
                </p>

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
