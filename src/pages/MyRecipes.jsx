/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";

import { getMyRecipes, deleteRecipe } from "../services/recipeApi";
import { useNotification } from "../context/NotificationContext";

function normalizeRecipes(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.recipes)) return data.recipes;
  if (Array.isArray(data?.data?.recipes)) return data.data.recipes;

  return [];
}

function isRecipePublished(recipe) {
  const fields = [
    "isPublished",
    "published",
    "is_published",
    "publishStatus",
    "status",
  ];

  for (const field of fields) {
    const value = recipe?.[field];

    if (value === undefined || value === null) continue;

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["published", "public", "true", "1"].includes(normalized)) {
        return true;
      }

      if (
        ["draft", "unpublished", "private", "false", "0"].includes(normalized)
      ) {
        return false;
      }
    }
  }

  return true;
}

function getRecipesEndpoint() {
  const configuredUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  if (configuredUrl.endsWith("/api/recipes")) {
    return configuredUrl;
  }

  if (configuredUrl.endsWith("/api")) {
    return `${configuredUrl}/recipes`;
  }

  return `${configuredUrl}/api/recipes`;
}

async function requestPublishToggle(recipeId) {
  const response = await fetch(
    `${getRecipesEndpoint()}/${encodeURIComponent(String(recipeId))}/publish`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Could not update recipe publish status.");
  }

  return data;
}

function MyRecipes() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const auth = useSelector((state) => state.auth || {});

  const user = auth.user || auth.currentUser || auth.profile || null;

  const isLoggedIn = Boolean(
    auth.isAuthenticated || auth.isLoggedIn || auth.token || user,
  );

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  // Custom delete confirmation card.
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getMyRecipes();
      setRecipes(normalizeRecipes(response));
    } catch (fetchError) {
      console.error("My Kitchen recipes error:", fetchError);

      const message = fetchError.message || "Unable to load your recipes.";

      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }

    loadRecipes();
  }, [isLoggedIn, navigate, loadRecipes]);

  const handleCreateRecipe = () => {
    navigate("/create-recipe", {
      state: { fromMyKitchen: true },
    });
  };

  // Publish or unpublish a recipe.
  const handleTogglePublish = async (recipe) => {
    const recipeId = recipe._id || recipe.id;

    if (!recipeId || actionLoadingId) return;

    const wasPublished = isRecipePublished(recipe);

    setActionLoadingId(String(recipeId));
    setError("");

    try {
      const result = await requestPublishToggle(recipeId);

      let nextStatus;

      if (typeof result.isPublished === "boolean") {
        nextStatus = result.isPublished;
      } else if (typeof result.published === "boolean") {
        nextStatus = result.published;
      } else if (result.recipe) {
        nextStatus = isRecipePublished(result.recipe);
      } else {
        nextStatus = !wasPublished;
      }

      setRecipes((current) =>
        current.map((item) => {
          const itemId = item._id || item.id;

          if (String(itemId) !== String(recipeId)) {
            return item;
          }

          return {
            ...item,
            ...(result.recipe || {}),
            isPublished: nextStatus,
            published: nextStatus,
          };
        }),
      );

      notify(
        result.message ||
          (nextStatus
            ? "Recipe published successfully!"
            : "Recipe unpublished successfully."),
        "success",
      );
    } catch (publishError) {
      console.error("Publish recipe error:", publishError);

      notify(
        publishError.message || "Unable to update recipe publish status.",
        "error",
      );
    } finally {
      setActionLoadingId("");
    }
  };

  // Open the custom confirmation card.
  const openDeleteConfirmation = (recipe) => {
    if (actionLoadingId) return;
    setRecipeToDelete(recipe);
  };

  // Delete only after the user confirms inside the card.
  const handleDelete = async () => {
    if (!recipeToDelete || actionLoadingId) return;

    const recipe = recipeToDelete;
    const recipeId = recipe._id || recipe.id;

    if (!recipeId) {
      setRecipeToDelete(null);
      notify("Recipe ID is missing.", "error");
      return;
    }

    setActionLoadingId(String(recipeId));
    setError("");

    try {
      await deleteRecipe(recipeId);

      setRecipes((current) =>
        current.filter(
          (item) => String(item._id || item.id) !== String(recipeId),
        ),
      );

      setRecipeToDelete(null);

      notify("Recipe deleted successfully.", "success");
    } catch (deleteError) {
      console.error("Delete recipe error:", deleteError);

      setRecipeToDelete(null);

      notify(deleteError.message || "Unable to delete this recipe.", "error");
    } finally {
      setActionLoadingId("");
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="my-recipes-page">
      <Header />

      {/* Custom Delete Confirmation Card */}
      {recipeToDelete && (
        <div
          className="confirm-overlay"
          onClick={() => {
            if (!actionLoadingId) {
              setRecipeToDelete(null);
            }
          }}
        >
          <div
            className="confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-icon" aria-hidden="true">
              !
            </div>

            <h2 id="my-delete-title">Delete this recipe?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{recipeToDelete.name || "this recipe"}</strong>? This
              action cannot be undone.
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel"
                disabled={Boolean(actionLoadingId)}
                onClick={() => setRecipeToDelete(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                disabled={Boolean(actionLoadingId)}
                onClick={handleDelete}
              >
                {actionLoadingId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="my-recipes-container">
        <button
          type="button"
          className="my-recipes-back"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

        <header className="my-recipes-header">
          <span>YOUR PERSONAL COOKBOOK</span>

          <h1>My Kitchen</h1>

          <p>
            Your recipes, your creations. Keep everything you have cooked and
            shared in one place.
          </p>

          <button
            type="button"
            className="create-recipe-button"
            onClick={handleCreateRecipe}
          >
            + Create Recipe
          </button>
        </header>

        <div className="my-recipes-summary">
          <div>
            <span className="my-recipes-summary-icon">🍽️</span>

            <div>
              <strong>{recipes.length}</strong>
              <span>{recipes.length === 1 ? "Recipe" : "Recipes"}</span>
            </div>
          </div>

          <p>Manage and publish your own recipe collection.</p>
        </div>

        {loading && (
          <div className="recipes-loading">
            <div className="loading-spinner" />
            <p>Loading your kitchen...</p>
          </div>
        )}

        {!loading && error && (
          <div className="recipe-error" role="alert">
            <p>{error}</p>

            <button type="button" onClick={loadRecipes}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && recipes.length > 0 && (
          <div className="my-recipes-grid">
            {recipes.map((recipe, index) => {
              const recipeId = recipe._id || recipe.id;

              const isWorking = actionLoadingId === String(recipeId);

              const published = isRecipePublished(recipe);

              return (
                <article className="my-recipe-item" key={recipeId || index}>
                  <RecipeCard recipe={recipe} />

                  <div className="my-recipe-publication">
                    <span
                      className={`my-recipe-status ${
                        published ? "is-published" : "is-draft"
                      }`}
                    >
                      <span className="status-dot" aria-hidden="true" />
                      {published ? "Published" : "Draft"}
                    </span>

                    {recipe.recipeType === "community" && (
                      <button
                        type="button"
                        className={`my-recipe-publish-button ${
                          published ? "is-published" : "is-draft"
                        }`}
                        disabled={Boolean(actionLoadingId)}
                        onClick={() => handleTogglePublish(recipe)}
                      >
                        {isWorking ? (
                          <>
                            <span className="publish-button-spinner" />
                            Updating...
                          </>
                        ) : published ? (
                          <>
                            <span aria-hidden="true">↻</span>
                            Unpublish
                          </>
                        ) : (
                          <>
                            <span aria-hidden="true">↗</span>
                            Publish Recipe
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="my-recipe-actions">
                    <button
                      type="button"
                      className="my-recipe-edit"
                      disabled={Boolean(actionLoadingId)}
                      onClick={() => {
                        if (!recipeId) {
                          notify("Recipe ID is missing.", "error");
                          return;
                        }

                        navigate(
                          `/edit-recipe/${encodeURIComponent(String(recipeId))}`,
                        );
                      }}
                    >
                      Edit Recipe
                    </button>

                    <button
                      type="button"
                      className="my-recipe-delete"
                      disabled={Boolean(actionLoadingId)}
                      onClick={() => openDeleteConfirmation(recipe)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <div className="my-recipes-empty">
            <span>👨‍🍳</span>

            <h2>Your cookbook is waiting!</h2>

            <p>Create your first recipe and it will appear here.</p>

            <button
              type="button"
              className="create-recipe-button"
              onClick={handleCreateRecipe}
            >
              Create Your First Recipe
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MyRecipes;
