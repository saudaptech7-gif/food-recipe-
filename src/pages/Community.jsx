/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import RecipeSocial from "../components/RecipeSocial";

import { getUserRecipes } from "../services/recipeApi";
import { useNotification } from "../context/NotificationContext";

// =====================================
// CONSTANTS
// =====================================

const COMMUNITY_CATEGORIES = [
  "All",
  "Baking",
  "Budget",
  "Recipes",
  "Inspiration",
  "Health",
];

// =====================================
// HELPERS
// =====================================

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
    return true;
  }

  return category === selected;
}

// =====================================
// COMMUNITY PAGE
// =====================================

function Community() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  // =====================================
  // LOAD COMMUNITY RECIPES
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadCommunity() {
      setLoading(true);
      setError("");

      try {
        const response = await getUserRecipes();

        if (!active) return;

        setRecipes(normalizeRecipes(response));
      } catch (requestError) {
        if (!active) return;

        console.error("Failed to load community recipes:", requestError);

        const errorMessage =
          requestError?.message || "Community recipes could not be loaded.";

        setRecipes([]);
        setError(errorMessage);

        notify(errorMessage, "error");
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
  }, [retryCount, notify]);

  // =====================================
  // FILTER, SEARCH AND SORT
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
                onClick={() => navigate("/create-recipe")}
              >
                Share your recipe
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

        {/* BENEFITS */}

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
              <p>Meet chefs who love good food.</p>
            </div>
          </article>

          <article className="community-benefit">
            <span className="community-benefit-icon">✧</span>

            <div>
              <h2>Share</h2>
              <p>Inspire others with your recipes.</p>
            </div>
          </article>
        </section>

        {/* DISCOVER RECIPES */}

        <section id="community-discover" className="community-discover">
          <div className="community-section-heading">
            <span className="community-section-eyebrow">FROM OUR KITCHENS</span>

            <h2>Discover Community Recipes</h2>

            <p>
              Explore delicious ideas shared by home chefs in the Savorly
              community.
            </p>
          </div>

          {/* STATS */}

          <div className="community-stats">
            <div className="community-stat">
              <strong>{recipes.length}</strong>
              <span>Community Recipes</span>
            </div>

            <div className="community-stat">
              <strong>{chefCount}</strong>
              <span>Home Chefs</span>
            </div>
          </div>

          {/* SEARCH */}

          <div className="community-toolbar">
            <div className="community-search">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                aria-label="Search community recipes"
                placeholder="Search recipes, ingredients or chefs..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="community-sort">
              <label htmlFor="community-sort">Sort by</label>

              <select
                id="community-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="rating">Top rated</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {/* CATEGORY FILTERS */}

          <div
            className="community-categories"
            aria-label="Filter recipes by category"
          >
            {COMMUNITY_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  activeCategory === category
                    ? "community-category active"
                    : "community-category"
                }
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* LOADING */}

          {loading && (
            <div className="community-state">
              <div className="loading-spinner" />

              <h3>Finding delicious recipes...</h3>

              <p>Please wait while we load the community.</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="community-state community-error-state">
              <span className="community-state-icon">!</span>

              <h3>We couldn't load the recipes</h3>

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

          {/* EMPTY RESULTS */}

          {!loading && !error && filteredRecipes.length === 0 && (
            <div className="community-state community-empty-state">
              <span className="community-state-icon">♡</span>

              <h3>
                {recipes.length === 0
                  ? "No community recipes yet"
                  : "No recipes found"}
              </h3>

              <p>
                {recipes.length === 0
                  ? "Be the first to share something delicious with the community."
                  : "Try another search or category to discover more recipes."}
              </p>

              {recipes.length === 0 ? (
                <button
                  type="button"
                  className="community-button-primary"
                  onClick={() => navigate("/create-recipe")}
                >
                  Share your recipe
                </button>
              ) : (
                <button
                  type="button"
                  className="community-button-primary"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* RECIPE GRID */}

          {!loading && !error && filteredRecipes.length > 0 && (
            <>
              <div className="community-results-heading">
                <p>
                  Showing <strong>{filteredRecipes.length}</strong>{" "}
                  {filteredRecipes.length === 1 ? "recipe" : "recipes"}
                </p>

                {(search ||
                  activeCategory !== "All" ||
                  sortBy !== "latest") && (
                  <button type="button" onClick={resetFilters}>
                    Clear filters
                  </button>
                )}
              </div>

              <div className="recipes-grid community-recipes-grid">
                {filteredRecipes.map((recipe, index) => (
                  <article
                    className="community-recipe-item"
                    key={
                      recipe._id ||
                      recipe.id ||
                      `${getRecipeName(recipe)}-${index}`
                    }
                  >
                    <RecipeCard recipe={recipe} />

                    <RecipeSocial recipe={recipe} />
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        {/* CALL TO ACTION */}

        <section className="community-cta">
          <div className="community-cta-content">
            <span className="community-section-eyebrow">
              YOUR KITCHEN, YOUR STORY
            </span>

            <h2>Have a recipe worth sharing?</h2>

            <p>
              Share your favourite dish and inspire someone else's next meal.
            </p>

            <button
              type="button"
              className="community-button-primary"
              onClick={() => navigate("/create-recipe")}
            >
              Create a recipe
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="community-cta-art" aria-hidden="true">
            👨‍🍳
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Community;
