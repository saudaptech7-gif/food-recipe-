/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getRecipes } from "../services/recipeApi";

import {
  setRecipes,
  setPagination,
  setLoading,
  setError,
  setFilters,
} from "../redux/recipeSlice";

import RecipeCard from "../components/RecipeCard";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";

function Home() {
  const dispatch = useDispatch();

  const cookingSceneRef = useRef(null);

  const [cookingProgress, setCookingProgress] = useState(0);

  const {
    recipes = [],
    loading,
    error,
    filters = {},
    pagination = {},
  } = useSelector((state) => state.recipes);

  const safeFilters = {
    category: "",
    search: "",
    difficulty: "",
    subcategory: "",
    dishType: "",
    ...filters,
  };

  const currentPage = pagination.currentPage || 1;
  const totalPages = pagination.totalPages || 1;
  const totalRecipes = pagination.totalRecipes || 0;

  /* =====================================================
     SCROLL CONTROLLED COOKING ANIMATION
  ===================================================== */

  useEffect(() => {
    const handleScroll = () => {
      const scene = cookingSceneRef.current;

      if (!scene) return;

      const section = scene.closest(".hero-scroll-section");

      if (!section) return;

      const rect = section.getBoundingClientRect();

      const scrollDistance =
        section.offsetHeight - window.innerHeight;

      if (scrollDistance <= 0) return;

      const progress = Math.min(
        Math.max(-rect.top / scrollDistance, 0),
        1
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

  /* =====================================================
     FETCH RECIPES
  ===================================================== */

  const fetchRecipes = async (
    currentFilters,
    page = 1
  ) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const data = await getRecipes({
        ...currentFilters,
        page,
        limit: 9,
      });

      // Backend currently returns an array directly
      const recipeList = Array.isArray(data)
        ? data
        : Array.isArray(data?.recipes)
          ? data.recipes
          : [];

      dispatch(setRecipes(recipeList));

      // Current backend returns an array,
      // so pagination is handled safely here.
      dispatch(
        setPagination({
          currentPage: page,
          totalPages:
            recipeList.length > 0
              ? Math.ceil(recipeList.length / 9)
              : 1,
          totalRecipes: recipeList.length,
        })
      );
    } catch (error) {
      console.error("Fetch recipes error:", error);

      dispatch(
        setRecipes([])
      );

      dispatch(
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalRecipes: 0,
        })
      );

      dispatch(
        setError(
          error.message || "Failed to fetch recipes"
        )
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  /* =====================================================
     INITIAL FETCH
  ===================================================== */

  useEffect(() => {
    fetchRecipes(safeFilters, currentPage);

    // Initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     CATEGORY
  ===================================================== */

  const handleCategoryChange = (category) => {
    const newFilters = {
      ...safeFilters,
      category,
    };

    dispatch(setFilters(newFilters));

    fetchRecipes(newFilters, 1);
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const handleSearch = (search) => {
    const newFilters = {
      ...safeFilters,
      search,
    };

    dispatch(setFilters(newFilters));

    fetchRecipes(newFilters, 1);
  };

  /* =====================================================
     FILTER
  ===================================================== */

  const handleFilterChange = (newFilterValues) => {
    const newFilters = {
      ...safeFilters,
      ...newFilterValues,
    };

    dispatch(setFilters(newFilters));

    fetchRecipes(newFilters, 1);
  };

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const handleClearFilters = () => {
    const newFilters = {
      ...safeFilters,
      difficulty: "",
      subcategory: "",
      dishType: "",
    };

    dispatch(setFilters(newFilters));

    fetchRecipes(newFilters, 1);
  };

  /* =====================================================
     PAGINATION
  ===================================================== */

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;

    fetchRecipes(safeFilters, page);
  };

  /* =====================================================
     EXPLORE BUTTON
  ===================================================== */

  const handleExploreRecipes = () => {
    document
      .querySelector(".recipes-section")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <div className="home-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <Header
        onCategoryChange={handleCategoryChange}
      />


      {/* =================================================
          HERO SCROLL SECTION
      ================================================= */}

      <section className="hero-scroll-section">

        <div className="hero-sticky">

          <section className="hero-section">

            {/* HERO CONTENT */}

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
                Explore thousands of recipes for baking,
                healthy meals, quick budgets and everyday
                inspiration.
              </p>

              <button
                className="hero-button"
                onClick={handleExploreRecipes}
              >
                Explore Recipes
                <span>→</span>
              </button>

            </div>


            {/* =================================================
                PROFESSIONAL COOKING ANIMATION
            ================================================= */}

            <div
              className="cooking-scene"
              ref={cookingSceneRef}
            >

              {/* Ambient glow */}

              <div
                className="cook-glow"
                style={{
                  opacity:
                    cookingProgress > 0 ? 1 : 0,
                }}
              />


              {/* Counter shadow */}

              <div
                className="counter-shadow"
                style={{
                  opacity:
                    cookingProgress > 0.05
                      ? 1
                      : 0,

                  transform: `
                    translateX(-50%)
                    scaleX(${0.7 + cookingProgress * 0.3})
                  `,
                }}
              />


              {/* PLATE */}

              <div
                className="pro-plate"
                style={{
                  opacity:
                    Math.min(
                      cookingProgress / 0.12,
                      1
                    ),

                  transform: `
                    translate(-50%, -50%)
                    scale(
                      ${
                        0.72 +
                        Math.min(
                          cookingProgress / 0.12,
                          1
                        ) *
                          0.28
                      }
                    )
                  `,
                }}
              >
                <div className="plate-rim"></div>
                <div className="plate-center"></div>
              </div>


              {/* CARROT */}

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
                <span></span>
              </div>


              {/* TOMATO */}

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
                <span></span>
              </div>


              {/* BROCCOLI */}

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
                <span></span>
              </div>


              {/* LEAF */}

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
                <span></span>
              </div>


              {/* PAN */}

              <div
                className="pro-pan"
                style={{
                  opacity:
                    cookingProgress >= 0.3 &&
                    cookingProgress < 0.82
                      ? 1
                      : 0,

                  transform: `
                    translate(-50%,-50%)
                    scale(
                      ${
                        cookingProgress >= 0.3
                          ? 1
                          : 0.72
                      }
                    )
                  `,
                }}
              >
                <div className="pan-inside"></div>
                <div className="pan-handle"></div>
              </div>


              {/* FOOD INSIDE PAN */}

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
                <span className="food-dot dot-1"></span>
                <span className="food-dot dot-2"></span>
                <span className="food-dot dot-3"></span>
                <span className="food-dot dot-4"></span>
                <span className="food-dot dot-5"></span>
              </div>


              {/* LID */}

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
                      : cookingProgress < 0.55
                        ? "translate(-50%,0) rotate(0deg)"
                        : cookingProgress < 0.7
                          ? "translate(-50%,0) rotate(0deg)"
                          : "translate(-50%,-220px) rotate(12deg)",
                }}
              >
                <div className="lid-top"></div>
                <div className="lid-handle"></div>
              </div>


              {/* HEAT */}

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
                <span></span>
                <span></span>
                <span></span>
              </div>


              {/* FINAL DISH */}

              <div
                className="final-food"
                style={{
                  opacity:
                    cookingProgress >= 0.72
                      ? Math.min(
                          (cookingProgress - 0.72) /
                            0.1,
                          1
                        )
                      : 0,

                  transform: `
                    translate(-50%,-50%)
                    scale(
                      ${
                        cookingProgress >= 0.72
                          ? 1
                          : 0.45
                      }
                    )
                  `,
                }}
              >
                <div className="dish-food">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>

                  <i></i>
                  <i></i>
                </div>
              </div>


              {/* STEAM */}

              <div
                className="steam"
                style={{
                  opacity:
                    cookingProgress >= 0.84
                      ? Math.min(
                          (cookingProgress - 0.84) /
                            0.1,
                          1
                        )
                      : 0,
                }}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>

            </div>

          </section>

        </div>

      </section>


      {/* =================================================
          RECIPES
      ================================================= */}

      <section className="recipes-section">

        <div className="section-heading">

          <div>
            <span>OUR COLLECTION</span>

            <h1>Explore Recipes</h1>
          </div>

          <p>
            Find something delicious for every occasion.
          </p>

        </div>


        <SearchBar
          onSearch={handleSearch}
        />


        <FilterBar
          difficulty={safeFilters.difficulty}
          subcategory={safeFilters.subcategory}
          dishType={safeFilters.dishType}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />


        {loading && (
          <div className="recipes-loading">

            <div className="loading-spinner"></div>

            <p>
              Finding delicious recipes...
            </p>

          </div>
        )}


        {error && (
          <div className="recipe-error">

            <p>{error}</p>

          </div>
        )}


        {!loading && !error && (
          <>

            <div className="recipes-grid">

              {Array.isArray(recipes) &&
                recipes.map((recipe) => (
                  <RecipeCard
                    key={
                      recipe._id ||
                      recipe.id
                    }
                    recipe={recipe}
                  />
                ))}

            </div>


            {recipes.length > 0 && (
              <div className="pagination">

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    handlePageChange(
                      currentPage - 1
                    )
                  }
                >
                  ← Previous
                </button>


                <span>
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>


                <button
                  type="button"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    handlePageChange(
                      currentPage + 1
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

    </div>
  );
}

export default Home;