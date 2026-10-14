/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import RecipeSocial from "../components/RecipeSocial";

import { getUserRecipes } from "../services/recipeApi";
import { useNotification } from "../context/NotificationContext";

const COMMUNITY_CATEGORIES = [
  "All",
  "Baking",
  "Budget",
  "Recipes",
  "Inspiration",
  "Health",
];

function normalizeRecipes(response) {
  if (Array.isArray(response)) return response;

  const possibleLists = [
    response?.recipes,
    response?.data?.recipes,
    response?.results,
    response?.items,
    response?.data,
    response?.data?.data?.recipes,
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
  )
    .trim()
    .toLowerCase();
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
  return Number(recipe?.averageRating ?? recipe?.rating ?? 0);
}

function categoryMatches(recipeCategory, selectedCategory) {
  if (selectedCategory === "All") return true;

  const category = recipeCategory.trim().toLowerCase();
  const selected = selectedCategory.trim().toLowerCase();

  if (selected === "budget") {
    return category === "budget" || category === "budgets";
  }

  return category === selected;
}

function Community() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const auth = useSelector((state) => state.auth || {});

  const user = auth.user || auth.currentUser || auth.profile || null;

  const isLoggedIn = Boolean(
    auth.isAuthenticated || auth.isLoggedIn || auth.token || user,
  );

  const notifyRef = useRef(notify);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

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

        notifyRef.current(errorMessage, "error");
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
  }, [retryCount]);

  // =====================================
  // SEARCH, FILTER AND SORT
  // =====================================

  const filteredRecipes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = recipes.filter((recipe) => {
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

    return filtered.sort((a, b) => {
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
  // COMMUNITY STATISTICS
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

  const averageRating = useMemo(() => {
    const ratedRecipes = recipes.filter(
      (recipe) => getRecipeRating(recipe) > 0,
    );

    if (ratedRecipes.length === 0) return "—";

    const average =
      ratedRecipes.reduce(
        (total, recipe) => total + getRecipeRating(recipe),
        0,
      ) / ratedRecipes.length;

    return average.toFixed(1);
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
            <div className="community-eyebrow">
              <span className="community-eyebrow-dot" />
              THE SAVORLY COMMUNITY
            </div>

            <h1>
              Every recipe has a story.
              <span> Make yours unforgettable.</span>
            </h1>

            <p className="community-hero-description">
              Discover inspiring dishes, meet passionate home chefs and find
              something delicious to create next. Your next favourite recipe
              starts here.
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
              <span aria-hidden="true">✦</span>
              <p>Discover. Cook. Connect. Repeat.</p>
            </div>
          </div>

          <div className="community-hero-art" aria-hidden="true">
            <div className="community-art-glow" />
            <div className="community-art-orbit community-art-orbit-one" />
            <div className="community-art-orbit community-art-orbit-two" />

            <div className="community-art-food">
              <span className="community-art-food-spark spark-one">✦</span>

              <span className="community-art-food-spark spark-two">✧</span>

              <span className="community-food-emoji">🥗</span>
            </div>

            <div className="community-art-note community-art-note-top">
              <span className="community-art-note-icon">🍓</span>

              <div>
                <strong>Fresh inspiration</strong>
                <small>Something good is cooking</small>
              </div>
            </div>

            <div className="community-art-note community-art-note-bottom">
              <span className="community-art-note-icon">♥</span>

              <div>
                <strong>Made with love</strong>
                <small>Shared by home chefs</small>
              </div>
            </div>

            <div className="community-art-caption">
              A little inspiration for your next meal.
            </div>
          </div>

          <span className="community-hero-decoration decoration-one" />
          <span className="community-hero-decoration decoration-two" />
        </section>

        {/* COMMUNITY BENEFITS */}

        <section className="community-benefits" aria-label="Community benefits">
          <article className="community-benefit">
            <span className="community-benefit-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </span>

            <div>
              <h2>Find inspiration</h2>
              <p>Discover ideas for your next meal.</p>
            </div>

            <span className="community-benefit-arrow">↗</span>
          </article>

          <article className="community-benefit">
            <span className="community-benefit-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.5 8.8c0 5.2-8.5 10-8.5 10s-8.5-4.8-8.5-10a4.4 4.4 0 0 1 8.5-1.4 4.4 4.4 0 0 1 8.5 1.4Z" />
              </svg>
            </span>

            <div>
              <h2>Build connections</h2>
              <p>Meet chefs who love good food.</p>
            </div>

            <span className="community-benefit-arrow">↗</span>
          </article>

          <article className="community-benefit">
            <span className="community-benefit-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
              </svg>
            </span>

            <div>
              <h2>Share your story</h2>
              <p>Inspire someone else's kitchen.</p>
            </div>

            <span className="community-benefit-arrow">↗</span>
          </article>
        </section>

        {/* DISCOVER RECIPES */}

        <section id="community-discover" className="community-discover">
          <div className="community-section-heading">
            <div className="community-section-heading-copy">
              <span className="community-section-eyebrow">
                FROM OUR KITCHENS
              </span>

              <h2>
                Made by the community.
                <span> Shared with love.</span>
              </h2>

              <p>
                Real recipes from real kitchens. Find your next favourite dish
                and get inspired by our home chefs.
              </p>
            </div>

            <div className="community-heading-mark" aria-hidden="true">
              <span>✳</span>
            </div>
          </div>

          {/* STATS */}

          <div className="community-stats">
            <article className="community-stat">
              <span className="community-stat-icon">🍽️</span>

              <div>
                <strong>{recipes.length}</strong>
                <span>Community recipes</span>
              </div>
            </article>

            <article className="community-stat">
              <span className="community-stat-icon">👨‍🍳</span>

              <div>
                <strong>{chefCount}</strong>
                <span>Home chefs</span>
              </div>
            </article>

            <article className="community-stat">
              <span className="community-stat-icon">★</span>

              <div>
                <strong>{averageRating}</strong>
                <span>Average recipe rating</span>
              </div>
            </article>
          </div>

          {/* SEARCH AND SORT */}

          <div className="community-filter-panel">
            <div className="community-filter-top">
              <div className="community-filter-title">
                <span className="community-filter-title-icon">⌕</span>

                <div>
                  <h3>Find your next favourite</h3>
                  <p>Search through our community collection.</p>
                </div>
              </div>

              <div className="community-sort">
                <label htmlFor="community-sort">Sort recipes</label>

                <select
                  id="community-sort"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="latest">Latest first</option>
                  <option value="rating">Top rated</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>

            <div className="community-search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>

              <input
                type="search"
                aria-label="Search community recipes"
                placeholder="Search by recipe, ingredient or chef..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="community-search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="community-category-heading">
              <span>EXPLORE BY CATEGORY</span>

              {activeCategory !== "All" && (
                <button type="button" onClick={() => setActiveCategory("All")}>
                  Reset category
                </button>
              )}
            </div>

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
                  {category === "All" && <span aria-hidden="true">✦</span>}

                  {category === "Baking" && <span aria-hidden="true">🥐</span>}

                  {category === "Budget" && <span aria-hidden="true">♧</span>}

                  {category === "Recipes" && <span aria-hidden="true">🍲</span>}

                  {category === "Inspiration" && (
                    <span aria-hidden="true">✧</span>
                  )}

                  {category === "Health" && <span aria-hidden="true">🌿</span>}

                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* RESULTS HEADING */}

          {!loading && !error && (
            <div className="community-results-heading">
              <div>
                <span className="community-results-eyebrow">
                  THE RECIPE COLLECTION
                </span>

                <h3>
                  {activeCategory === "All"
                    ? "Explore all recipes"
                    : `${activeCategory} recipes`}
                </h3>
              </div>

              <p>
                <strong>{filteredRecipes.length}</strong>{" "}
                {filteredRecipes.length === 1 ? "recipe" : "recipes"} found
              </p>
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className="community-state">
              <span className="community-state-spinner" />

              <h3>Setting the table...</h3>

              <p>We're bringing the community's recipes to your kitchen.</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="community-state community-error-state">
              <span className="community-state-icon">!</span>

              <h3>Something went wrong</h3>

              <p>{error}</p>

              <button
                type="button"
                className="community-button-primary"
                onClick={handleRetry}
              >
                Try again <span aria-hidden="true">↻</span>
              </button>
            </div>
          )}

          {/* EMPTY RESULTS */}

          {!loading && !error && filteredRecipes.length === 0 && (
            <div className="community-state community-empty-state">
              <span className="community-state-icon">♡</span>

              <h3>
                {recipes.length === 0
                  ? "Your community cookbook starts here"
                  : "No recipes found"}
              </h3>

              <p>
                {recipes.length === 0
                  ? "Be the first home chef to share a delicious recipe."
                  : "Try another search or category to discover more recipes."}
              </p>

              {recipes.length === 0 ? (
                <button
                  type="button"
                  className="community-button-primary"
                  onClick={() => navigate("/create-recipe")}
                >
                  Share your recipe
                  <span aria-hidden="true">↗</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="community-button-primary"
                  onClick={resetFilters}
                >
                  Clear all filters
                  <span aria-hidden="true">↻</span>
                </button>
              )}
            </div>
          )}

          {/* RECIPE GRID */}

          {!loading && !error && filteredRecipes.length > 0 && (
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

                  <RecipeSocial recipe={recipe} isLoggedIn={isLoggedIn} />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* CALL TO ACTION */}

        <section className="community-cta">
          <div className="community-cta-decoration" aria-hidden="true">
            ✳
          </div>

          <div className="community-cta-content">
            <span className="community-section-eyebrow">
              YOUR KITCHEN. YOUR STORY.
            </span>

            <h2>
              Something delicious
              <span> starts with you.</span>
            </h2>

            <p>
              Share the dish you love. Inspire another home chef. Make the
              Savorly community a little more delicious.
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
            <span className="community-cta-art-ring" />
            <span className="community-cta-chef">👨‍🍳</span>
            <span className="community-cta-art-spark">✦</span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Community;
