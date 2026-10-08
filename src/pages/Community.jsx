import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";

import {
  getMyRecipes,
  getUserRecipes,
  togglePublishRecipe,
  deleteRecipe,
} from "../services/recipeApi";

function Community() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [activeTab, setActiveTab] = useState("my");

  const [myRecipes, setMyRecipes] = useState([]);
  const [userRecipes, setUserRecipes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // =====================================================
  // LOAD COMMUNITY DATA
  // =====================================================

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

        console.log("My Recipes:", myResult);

        console.log("User Recipes:", userResult);

        setMyRecipes(Array.isArray(myResult) ? myResult : []);

        setUserRecipes(Array.isArray(userResult) ? userResult : []);
      } catch (loadError) {
        console.error("Community loading error:", loadError);

        setError(loadError.message || "Failed to load community recipes.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [isLoggedIn, navigate]);

  // =====================================================
  // PUBLISH / UNPUBLISH
  // =====================================================

  const handlePublishToggle = async (recipe) => {
    const recipeId = recipe?._id || recipe?.id;

    if (!recipeId) {
      setError("Recipe ID is missing.");
      return;
    }

    const currentStatus = Boolean(recipe?.isPublished);

    try {
      setPublishingId(String(recipeId));
      setError("");

      const result = await togglePublishRecipe(recipeId, !currentStatus);

      console.log("Publish response:", result);

      const updatedRecipe = result?.recipe || result;

      const newPublishedStatus =
        typeof updatedRecipe?.isPublished === "boolean"
          ? updatedRecipe.isPublished
          : !currentStatus;

      // -----------------------------------------------
      // UPDATE MY RECIPES
      // -----------------------------------------------

      setMyRecipes((previousRecipes) =>
        previousRecipes.map((item) => {
          const itemId = item?._id || item?.id;

          if (String(itemId) !== String(recipeId)) {
            return item;
          }

          return {
            ...item,
            ...updatedRecipe,
            isPublished: newPublishedStatus,
          };
        }),
      );

      // -----------------------------------------------
      // RELOAD USER RECIPES
      // -----------------------------------------------

      const freshUserRecipes = await getUserRecipes();

      console.log("Fresh User Recipes:", freshUserRecipes);

      setUserRecipes(Array.isArray(freshUserRecipes) ? freshUserRecipes : []);

      // -----------------------------------------------
      // AFTER PUBLISH OPEN USER RECIPES
      // -----------------------------------------------

      if (newPublishedStatus) {
        setActiveTab("users");
      }
    } catch (publishError) {
      console.error("Publish error:", publishError);

      setError(publishError.message || "Failed to update publish status.");
    } finally {
      setPublishingId(null);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (recipe) => {
    const recipeId = recipe?._id || recipe?.id;

    if (!recipeId) {
      setError("Recipe ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(String(recipeId));
      setError("");

      await deleteRecipe(recipeId);

      setMyRecipes((previousRecipes) =>
        previousRecipes.filter((item) => {
          const itemId = item?._id || item?.id;

          return String(itemId) !== String(recipeId);
        }),
      );

      setUserRecipes((previousRecipes) =>
        previousRecipes.filter((item) => {
          const itemId = item?._id || item?.id;

          return String(itemId) !== String(recipeId);
        }),
      );
    } catch (deleteError) {
      console.error("Delete error:", deleteError);

      setError(deleteError.message || "Failed to delete recipe.");
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!isLoggedIn) {
    return null;
  }

  // =====================================================
  // ACTIVE RECIPES
  // =====================================================

  const activeRecipes = activeTab === "my" ? myRecipes : userRecipes;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="community-page">
      <Header />

      <main className="community-container">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="community-hero">
          <div className="community-hero-content">
            <span className="community-eyebrow">SAVORLY COMMUNITY</span>

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
            <span>＋</span>
            Create Recipe
          </button>
        </section>

        {/* =================================================
            TABS
        ================================================= */}

        <div className="community-tabs">
          <button
            type="button"
            className={
              activeTab === "my" ? "community-tab active" : "community-tab"
            }
            onClick={() => setActiveTab("my")}
          >
            <span className="community-tab-icon">👨‍🍳</span>

            <span>My Recipes</span>

            <span className="community-tab-count">{myRecipes.length}</span>
          </button>

          <button
            type="button"
            className={
              activeTab === "users" ? "community-tab active" : "community-tab"
            }
            onClick={() => setActiveTab("users")}
          >
            <span className="community-tab-icon">🌎</span>

            <span>User Recipes</span>

            <span className="community-tab-count">{userRecipes.length}</span>
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="community-error">
            <span>⚠️</span>

            <p>{error}</p>

            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="community-loading">
            <div className="loading-spinner"></div>

            <p>Loading community recipes...</p>
          </div>
        ) : activeRecipes.length === 0 ? (
          /* =================================================
              EMPTY STATE
          ================================================= */

          <div className="community-empty">
            <div className="community-empty-icon">🍳</div>

            <h2>
              {activeTab === "my"
                ? "No recipes yet"
                : "No community recipes yet"}
            </h2>

            <p>
              {activeTab === "my"
                ? "Create your first recipe and share it with the Savorly community."
                : "Published recipes from the Savorly community will appear here."}
            </p>

            {activeTab === "my" && (
              <button
                type="button"
                className="community-empty-button"
                onClick={() => navigate("/create-recipe")}
              >
                Create Your First Recipe
                <span>→</span>
              </button>
            )}
          </div>
        ) : (
          /* =================================================
              RECIPE GRID
          ================================================= */

          <section className="community-recipe-grid">
            {activeRecipes.map((recipe) => {
              const recipeId = recipe?._id || recipe?.id;

              if (!recipeId) {
                return null;
              }

              const isPublished = Boolean(recipe?.isPublished);

              const isPublishing = publishingId === String(recipeId);

              const isDeleting = deletingId === String(recipeId);

              return (
                <article
                  className="community-recipe-item"
                  key={String(recipeId)}
                >
                  {/* -----------------------------------------
                      RECIPE CARD
                  ----------------------------------------- */}

                  <RecipeCard recipe={recipe} />

                  {/* -----------------------------------------
                      MY RECIPE ACTIONS
                  ----------------------------------------- */}

                  {activeTab === "my" && (
                    <div
                      className="community-recipe-actions"
                      style={{
                        marginTop: "14px",
                        padding: "14px",
                        borderRadius: "16px",
                        background: "#fffaf4",
                        border: "1px solid #eee5dc",
                      }}
                    >
                      {/* STATUS */}

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          marginBottom: "12px",
                          padding: "7px 11px",
                          borderRadius: "999px",
                          background: isPublished ? "#eaf5ed" : "#fff7dc",
                          color: isPublished ? "#285943" : "#a56b00",
                          fontSize: "12px",
                          fontWeight: "800",
                        }}
                      >
                        <span>●</span>

                        {isPublished ? "Published" : "Private Draft"}
                      </div>

                      {/* BUTTONS */}

                      <div
                        style={{
                          display: "flex",
                          gap: "9px",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* EDIT */}

                        <button
                          type="button"
                          disabled={isPublishing || isDeleting}
                          onClick={() => navigate(`/edit-recipe/${recipeId}`)}
                          style={{
                            border: "1px solid #eee0d5",
                            padding: "10px 15px",
                            borderRadius: "11px",
                            background: "#ffffff",
                            color: "#285943",
                            fontSize: "13px",
                            fontWeight: "700",
                            fontFamily: "inherit",
                            cursor:
                              isPublishing || isDeleting
                                ? "not-allowed"
                                : "pointer",
                            opacity: isPublishing || isDeleting ? 0.55 : 1,
                          }}
                        >
                          ✏️ Edit
                        </button>

                        {/* PUBLISH */}

                        <button
                          type="button"
                          disabled={isPublishing || isDeleting}
                          onClick={() => handlePublishToggle(recipe)}
                          style={{
                            border: "none",
                            padding: "10px 17px",
                            borderRadius: "11px",
                            background: isPublished
                              ? "#fff0e9"
                              : "linear-gradient(135deg, #f98654, #ef5d35)",
                            color: isPublished ? "#dd5129" : "#ffffff",
                            fontSize: "13px",
                            fontWeight: "800",
                            fontFamily: "inherit",
                            cursor:
                              isPublishing || isDeleting
                                ? "not-allowed"
                                : "pointer",
                            opacity: isPublishing || isDeleting ? 0.55 : 1,
                            boxShadow: isPublished
                              ? "none"
                              : "0 8px 18px rgba(239, 93, 53, 0.22)",
                          }}
                        >
                          {isPublishing
                            ? "⏳ Updating..."
                            : isPublished
                              ? "↩ Unpublish"
                              : "🚀 Publish Recipe"}
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          disabled={isPublishing || isDeleting}
                          onClick={() => handleDelete(recipe)}
                          style={{
                            border: "1px solid #f1d7d2",
                            padding: "10px 15px",
                            borderRadius: "11px",
                            background: "#fff7f5",
                            color: "#c94a3b",
                            fontSize: "13px",
                            fontWeight: "700",
                            fontFamily: "inherit",
                            cursor:
                              isPublishing || isDeleting
                                ? "not-allowed"
                                : "pointer",
                            opacity: isPublishing || isDeleting ? 0.55 : 1,
                          }}
                        >
                          {isDeleting ? "⏳ Deleting..." : "🗑️ Delete"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* -----------------------------------------
                      USER RECIPE INFO
                  ----------------------------------------- */}

                  {activeTab === "users" && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "#eaf5ed",
                        color: "#285943",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      ✨ Published by a Savorly creator
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default Community;
