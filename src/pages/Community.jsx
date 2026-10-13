/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import RecipeSocial from "../components/RecipeSocial";

import { getUserRecipes } from "../services/recipeApi";

// =====================================
// HELPERS
// =====================================

const COMMUNITY_CATEGORIES = [
  "All",
  "Baking",
  "Budget",
  "Recipes",
  "Inspiration",
  "Health",
];

function normalizeRecipes(response) {
  if (Array.isArray(response)) {
    return response;
  }

  const possibleLists = [
    response?.recipes,
    response?.data?.recipes,
    response?.results,
    response?.items,
    response?.data,
  ];

  return possibleLists.find(Array.isArray) || [];
}

function getRecipeCategory(recipe) {
  return String(
    recipe?.mainCategory ||
      recipe?.maincategory ||
      recipe?.category ||
      recipe?.subcategory ||
      recipe?.dish_type ||
      recipe?.dishType ||
      "",
  ).trim();
}

function getChef(recipe) {
  const creator = recipe?.createdBy || recipe?.author;

  if (creator && typeof creator === "object") {
    return {
      id: creator._id || creator.id || "",
      name: creator.chef || creator.chefName || creator.name || "Savorly Chef",
    };
  }

  return {
    id: "",
    name: (typeof creator === "string" && creator) || "Savorly Chef",
  };
}

function getRecipeName(recipe) {
  return String(recipe?.name || recipe?.title || "Untitled Recipe");
}

function getRecipeDate(recipe) {
  const dateValue = recipe?.createdAt || recipe?.updatedAt;

  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRecipeRating(recipe) {
  return Number(recipe?.averageRating || recipe?.rating || 0);
}

function categoryMatches(recipeCategory, selectedCategory) {
  if (selectedCategory === "All") {
    return true;
  }

  const category = recipeCategory.toLowerCase();
  const selected = selectedCategory.toLowerCase();

  if (selected === "budget") {
    return category === "budget" || category === "budgets";
  }

  if (selected === "recipes") {
    // "Recipes" is a broad collection label.
    return true;
  }

  return category === selected;
}

// =====================================
// COMMUNITY PAGE
// =====================================

function Community() {
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth || {});

  const user = auth.user || auth.currentUser || auth.profile || null;

  const isLoggedIn = Boolean(
    auth.isAuthenticated || auth.isLoggedIn || auth.token || user,
  );

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  // =====================================
  // LOAD COMMUNITY RECIPES
  // No recipe request for logged-out users.
  // =====================================

  useEffect(() => {
    let active = true;

    if (!isLoggedIn) {
      setRecipes([]);
      setLoading(false);
      setError("");

      return () => {
        active = false;
      };
    }

    async function loadCommunity() {
      setLoading(true);
      setError("");

      try {
        const response = await getUserRecipes();

        if (!active) {
          return;
        }

        setRecipes(normalizeRecipes(response));
      } catch (requestError) {
        if (!active) {
          return;
        }

        console.error("Failed to load community recipes:", requestError);

        setError(
          requestError?.message || "Community recipes load nahi ho sakin.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCommunity();

    return () => {
      active = false;
    };
  }, [isLoggedIn, retryCount]);

  // =====================================
  // SEARCH, FILTER AND SORT LOCALLY
  // These actions don't call the API.
  // =====================================

  const filteredRecipes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = recipes.filter((recipe) => {
      const chef = getChef(recipe);

      const name = getRecipeName(recipe).toLowerCase();

      const description = String(recipe?.description || "").toLowerCase();

      const ingredients = Array.isArray(recipe?.ingredients)
        ? recipe.ingredients
            .map((item) =>
              typeof item === "object"
                ? item?.name || item?.ingredient || ""
                : String(item),
            )
            .join(" ")
            .toLowerCase()
        : "";

      const chefName = chef.name.toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        description.includes(keyword) ||
        chefName.includes(keyword) ||
        ingredients.includes(keyword);

      const matchesCategory = categoryMatches(
        getRecipeCategory(recipe),
        activeCategory,
      );

      return matchesSearch && matchesCategory;
    });

    return result.sort((a, b) => {
      if (sortBy === "rating") {
        return getRecipeRating(b) - getRecipeRating(a);
      }

      if (sortBy === "name") {
        return getRecipeName(a).localeCompare(getRecipeName(b));
      }

      return (
        new Date(b?.createdAt || 0).getTime() -
        new Date(a?.createdAt || 0).getTime()
      );
    });
  }, [recipes, search, activeCategory, sortBy]);

  // =====================================
  // COMMUNITY STATS
  // Calculated from the recipes already loaded.
  // =====================================

  const chefCount = useMemo(() => {
    const uniqueChefs = new Set();

    recipes.forEach((recipe) => {
      const chef = getChef(recipe);

      if (chef.id) {
        uniqueChefs.add(String(chef.id));
      } else if (chef.name !== "Savorly Chef") {
        uniqueChefs.add(chef.name);
      }
    });

    return uniqueChefs.size;
  }, [recipes]);

  // =====================================
  // ACTIONS
  // =====================================

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setSortBy("latest");
  };

  const handleExplore = () => {
    document.getElementById("community-discover")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleRetry = () => {
    setRetryCount((count) => count + 1);
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="savorly-community-shell">
      <Header />

      <main className="savorly-community-main">
        {/* HERO */}

        <section className="community-hero">
          <div className="community-hero-content">
            <span className="community-eyebrow">
              <span className="community-eyebrow-dot" />
              THE SAVORLY COMMUNITY
            </span>

            <h1>
              Good food brings us together.
              <span> Great recipes make it memorable.</span>
            </h1>

            <p>
              Meet home chefs, discover new dishes, and share the recipes that
              make your kitchen special.
            </p>

            <div className="community-hero-actions">
              <button
                type="button"
                className="community-button-primary"
                onClick={() =>
                  isLoggedIn ? navigate("/create-recipe") : navigate("/login")
                }
              >
                {isLoggedIn ? "Share your recipe" : "Join the community"}

                <span aria-hidden="true">↗</span>
              </button>

              <button
                type="button"
                className="community-button-secondary"
                onClick={handleExplore}
              >
                Explore recipes
                <span aria-hidden="true">↓</span>
              </button>
            </div>

            <div className="community-hero-trust">
              <span className="community-trust-icon">✦</span>
              <span>Discover. Cook. Connect. Repeat.</span>
            </div>
          </div>

          <div className="community-hero-art" aria-hidden="true">
            <div className="community-art-orbit community-art-orbit-one" />
            <div className="community-art-orbit community-art-orbit-two" />

            <div className="community-art-food">
              <span className="community-food-spark spark-one">✦</span>
              <span className="community-food-spark spark-two">✧</span>
              <span className="community-food-emoji">🥗</span>
            </div>

            <div className="community-art-note community-art-note-top">
              <span>🍓</span>
              <div>
                <strong>Fresh inspiration</strong>
                <small>Every kitchen has a story</small>
              </div>
            </div>

            <div className="community-art-note community-art-note-bottom">
              <span className="community-note-heart">♥</span>
              <div>
                <strong>Made with love</strong>
                <small>Shared by our community</small>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK BENEFITS */}

        <section className="community-benefits" aria-label="Community benefits">
          <article className="community-benefit">
            <span className="community-benefit-icon">⌕</span>
            <div>
              <h2>Discover</h2>
              <p>Find ideas for your next meal.</p>
            </div>
          </article>

          <article className="community-benefit">
            <span className="community-benefit-icon">♡</span>
            <div>
              <h2>Connect</h2>
              <p>Follow chefs and exchange ideas.</p>
            </div>
          </article>

          <article className="community-benefit">
            <span className="community-benefit-icon">✎</span>
            <div>
              <h2>Share</h2>
              <p>Inspire others with your creations.</p>
            </div>
          </article>
        </section>

        {/* DISCOVER SECTION */}

        <section className="community-discover" id="community-discover">
          <div className="community-section-heading">
            <div>
              <span className="community-eyebrow">
                FROM OUR KITCHENS TO YOURS
              </span>

              <h2>Explore the community</h2>

              <p>Find a recipe, meet its creator, and join the conversation.</p>
            </div>

            {isLoggedIn && (
              <button
                type="button"
                className="community-create-link"
                onClick={() => navigate("/create-recipe")}
              >
                <span>＋</span> Create recipe
              </button>
            )}
          </div>

          {/* SUMMARY */}

          {isLoggedIn && !loading && !error && (
            <div className="community-stat-strip">
              <div className="community-stat">
                <span className="community-stat-icon">🍲</span>
                <div>
                  <strong>{recipes.length}</strong>
                  <span>Recipes shared</span>
                </div>
              </div>

              <div className="community-stat">
                <span className="community-stat-icon">👩‍🍳</span>
                <div>
                  <strong>{chefCount}</strong>
                  <span>Community chefs</span>
                </div>
              </div>

              <div className="community-stat">
                <span className="community-stat-icon">🔎</span>
                <div>
                  <strong>{filteredRecipes.length}</strong>
                  <span>Matching recipes</span>
                </div>
              </div>
            </div>
          )}

          {/* SIGN-IN PROMPT */}

          {!isLoggedIn && (
            <section className="community-access-panel">
              <span className="community-access-icon">✦</span>

              <h3>Your seat at the table is waiting.</h3>

              <p>
                Sign in to discover community recipes, follow other chefs, like
                dishes and leave comments.
              </p>

              <div className="community-access-actions">
                <button
                  type="button"
                  className="community-button-primary"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </button>

                <button
                  type="button"
                  className="community-button-secondary"
                  onClick={() => navigate("/signup")}
                >
                  Create an account
                </button>
              </div>
            </section>
          )}

          {/* SEARCH AND SORT */}

          {isLoggedIn && (
            <>
              <div className="community-toolbar">
                <label className="community-search">
                  <span className="community-search-icon" aria-hidden="true">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search recipes, ingredients or chefs..."
                    aria-label="Search community recipes"
                  />

                  {search && (
                    <button
                      type="button"
                      className="community-clear-search"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </label>

                <label className="community-sort">
                  <span>Sort by</span>

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    aria-label="Sort community recipes"
                  >
                    <option value="latest">Newest first</option>
                    <option value="rating">Highest rated</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </label>
              </div>

              {/* CATEGORY FILTERS */}

              <div className="community-filter-row">
                <div
                  className="community-category-filters"
                  aria-label="Filter recipes by category"
                >
                  {COMMUNITY_CATEGORIES.map((category) => (
                    <button
                      type="button"
                      key={category}
                      className={`community-category-chip ${
                        activeCategory === category ? "active" : ""
                      }`}
                      aria-pressed={activeCategory === category}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category === "All" && <span aria-hidden="true">✦ </span>}

                      {category}
                    </button>
                  ))}
                </div>

                {(search ||
                  activeCategory !== "All" ||
                  sortBy !== "latest") && (
                  <button
                    type="button"
                    className="community-reset-filters"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {/* LOADING STATE */}

              {loading && (
                <div
                  className="community-state community-loading-state"
                  role="status"
                  aria-live="polite"
                >
                  <span className="community-spinner" />

                  <h3>Setting the table...</h3>

                  <p>We're bringing the community recipes together.</p>
                </div>
              )}

              {/* ERROR STATE */}

              {!loading && error && (
                <div className="community-state community-error-state">
                  <span className="community-state-icon">!</span>

                  <h3>We couldn't load the recipes.</h3>

                  <p>{error}</p>

                  <button
                    type="button"
                    className="community-button-primary"
                    onClick={handleRetry}
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* RECIPE FEED */}

              {!loading && !error && filteredRecipes.length > 0 && (
                <>
                  <div className="community-feed-heading">
                    <div>
                      <h3>
                        {activeCategory === "All"
                          ? "Made by our chefs"
                          : `${activeCategory} recipes`}
                      </h3>

                      <p>
                        Showing {filteredRecipes.length}{" "}
                        {filteredRecipes.length === 1 ? "recipe" : "recipes"}
                      </p>
                    </div>
                  </div>

                  <div className="community-recipe-grid">
                    {filteredRecipes.map((recipe, index) => {
                      const recipeKey =
                        recipe._id ||
                        recipe.id ||
                        recipe.url ||
                        `${getRecipeName(recipe)}-${index}`;

                      const chef = getChef(recipe);
                      const category = getRecipeCategory(recipe);
                      const createdDate = getRecipeDate(recipe);

                      return (
                        <article
                          className="community-recipe-card"
                          key={recipeKey}
                        >
                          <div className="community-recipe-meta">
                            <span className="community-recipe-category">
                              {category || "Community recipe"}
                            </span>

                            {createdDate && <time>{createdDate}</time>}
                          </div>

                          <div className="community-recipe-card-content">
                            <RecipeCard recipe={recipe} />
                          </div>

                          <div className="community-card-chef">
                            <span className="community-card-chef-avatar">
                              {chef.name.trim().charAt(0).toUpperCase()}
                            </span>

                            <div className="community-card-chef-copy">
                              <span>CREATED BY</span>
                              <strong>{chef.name}</strong>
                            </div>

                            {chef.id && (
                              <button
                                type="button"
                                className="community-view-chef"
                                onClick={() => navigate(`/chefs/${chef.id}`)}
                              >
                                View chef ↗
                              </button>
                            )}
                          </div>

                          <RecipeSocial
                            recipe={recipe}
                            isLoggedIn={isLoggedIn}
                          />
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {/* EMPTY STATE */}

              {!loading && !error && filteredRecipes.length === 0 && (
                <div className="community-state community-empty-state">
                  <span className="community-state-icon">⌕</span>

                  <h3>
                    {recipes.length === 0
                      ? "The kitchen is ready for its first dish."
                      : "No recipes match your search."}
                  </h3>

                  <p>
                    {recipes.length === 0
                      ? "Community recipes will appear here once chefs have published them."
                      : "Try another keyword or reset the filters to discover more recipes."}
                  </p>

                  {recipes.length > 0 ? (
                    <button
                      type="button"
                      className="community-button-primary"
                      onClick={resetFilters}
                    >
                      Reset filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="community-button-primary"
                      onClick={() => navigate("/create-recipe")}
                    >
                      Share the first recipe
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* BOTTOM CALL TO ACTION */}

        <section className="community-bottom-cta">
          <div className="community-bottom-symbol" aria-hidden="true">
            ✦
          </div>

          <div className="community-bottom-copy">
            <span className="community-eyebrow">YOUR STORY BELONGS HERE</span>

            <h2>Every great recipe has a story.</h2>

            <p>Share yours with the people who love good food.</p>
          </div>

          <button
            type="button"
            className="community-button-primary"
            onClick={() =>
              isLoggedIn ? navigate("/create-recipe") : navigate("/signup")
            }
          >
            {isLoggedIn ? "Share your recipe" : "Join Savorly"}
            <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Community;
