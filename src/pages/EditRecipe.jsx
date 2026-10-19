import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import { useNotification } from "../context/NotificationContext";

import {
  getRecipeById,
  updateRecipe,
  uploadRecipeImages,
} from "../services/recipeApi";

const initialNutrients = {
  kcal: "",
  fat: "",
  saturates: "",
  carbs: "",
  sugars: "",
  fibre: "",
  protein: "",
  salt: "",
};

function EditRecipe() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const currentUser = useSelector((state) => state.auth.user);
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Recipes");
  const [difficulty, setDifficulty] = useState("Easy");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [nutrients, setNutrients] = useState(initialNutrients);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [isPublished, setIsPublished] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    let mounted = true;

    const loadRecipe = async () => {
      if (!isLoggedIn || !id) return;

      try {
        setLoading(true);
        setError("");

        const data = await getRecipeById(id);
        const recipe = data?.recipe || data?.data?.recipe || data?.data || data;

        if (!recipe || typeof recipe !== "object") {
          throw new Error("Recipe not found.");
        }

        if (recipe.recipeType !== "community") {
          throw new Error("Only community recipes can be edited.");
        }

        const userId = currentUser?._id || currentUser?.id;
        const owner = recipe.createdBy;
        const ownerId =
          typeof owner === "object" && owner !== null
            ? owner._id || owner.id
            : owner;

        if (!userId || !ownerId || String(userId) !== String(ownerId)) {
          throw new Error("You can only edit your own recipes.");
        }

        if (!mounted) return;

        setAuthorized(true);
        setName(recipe.name || "");
        setDescription(recipe.description || "");
        setCategory(
          recipe.mainCategory ||
            recipe.maincategory ||
            recipe.category ||
            "Recipes",
        );
        setDifficulty(recipe.difficulty || recipe.difficult || "Easy");
        setPrepTime(
          recipe.prepTime ||
            recipe.times?.preparation ||
            recipe.times?.Preparation ||
            "",
        );
        setCookTime(
          recipe.cookTime ||
            recipe.times?.cooking ||
            recipe.times?.Cooking ||
            "",
        );
        setServings(String(recipe.servings || recipe.serves || ""));

        setIngredients(
          Array.isArray(recipe.ingredients) && recipe.ingredients.length
            ? recipe.ingredients.map((item) =>
                typeof item === "object" && item !== null
                  ? item.name || item.ingredient || ""
                  : String(item ?? ""),
              )
            : [""],
        );

        setSteps(
          Array.isArray(recipe.steps) && recipe.steps.length
            ? recipe.steps.map((item) =>
                typeof item === "object" && item !== null
                  ? item.step || item.description || item.text || ""
                  : String(item ?? ""),
              )
            : [""],
        );

        setNutrients({
          kcal: String(recipe.nutrients?.kcal ?? ""),
          fat: String(recipe.nutrients?.fat ?? ""),
          saturates: String(recipe.nutrients?.saturates ?? ""),
          carbs: String(recipe.nutrients?.carbs ?? ""),
          sugars: String(recipe.nutrients?.sugars ?? ""),
          fibre: String(recipe.nutrients?.fibre ?? ""),
          protein: String(recipe.nutrients?.protein ?? ""),
          salt: String(recipe.nutrients?.salt ?? ""),
        });

        const images = Array.isArray(recipe.images)
          ? recipe.images.filter(Boolean)
          : recipe.image
            ? [recipe.image]
            : [];

        setExistingImages(images);
        setIsPublished(Boolean(recipe.isPublished));
      } catch (loadError) {
        console.error("Load recipe error:", loadError);

        if (mounted) {
          const message = loadError.message || "Failed to load recipe.";
          setError(message);
          notify(message, "error");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRecipe();

    return () => {
      mounted = false;
    };
  }, [id, isLoggedIn, currentUser, notify]);

  useEffect(() => {
    return () => {
      newPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [newPreviews]);

  const handleImages = (event) => {
    const selected = Array.from(event.target.files || []);

    if (!selected.length) return;

    if (selected.length > 6) {
      setError("You can select a maximum of 6 images.");
      event.target.value = "";
      return;
    }

    for (const image of selected) {
      if (!image.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        event.target.value = "";
        return;
      }

      if (image.size > 5 * 1024 * 1024) {
        setError("Each image must be smaller than 5 MB.");
        event.target.value = "";
        return;
      }
    }

    newPreviews.forEach((preview) => URL.revokeObjectURL(preview));

    setError("");
    setNewImages(selected);
    setNewPreviews(selected.map((image) => URL.createObjectURL(image)));
  };

  const updateIngredient = (index, value) => {
    setIngredients((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const addIngredient = () => {
    setIngredients((previous) => [...previous, ""]);
  };

  const removeIngredient = (index) => {
    setIngredients((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const updateStep = (index, value) => {
    setSteps((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const addStep = () => {
    setSteps((previous) => [...previous, ""]);
  };

  const removeStep = (index) => {
    setSteps((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const updateNutrient = (field, value) => {
    setNutrients((previous) => ({ ...previous, [field]: value }));
  };

  const validate = () => {
    if (!name.trim()) return "Recipe name is required.";
    if (!description.trim()) return "Recipe description is required.";
    if (!category.trim()) return "Please select a category.";
    if (!difficulty.trim()) return "Please select difficulty.";
    if (!prepTime.trim()) return "Preparation time is required.";
    if (!cookTime.trim()) return "Cooking time is required.";

    if (
      !servings.trim() ||
      !Number.isFinite(Number(servings)) ||
      Number(servings) <= 0
    ) {
      return "Please enter valid servings.";
    }

    if (!ingredients.some((item) => item.trim())) {
      return "Please add at least one ingredient.";
    }

    if (!steps.some((item) => item.trim())) {
      return "Please add at least one cooking step.";
    }

    if (existingImages.length === 0 && newImages.length === 0) {
      return "Please keep at least one recipe image.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!authorized || saving) return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      notify(validationError, "warning");
      return;
    }

    try {
      setSaving(true);
      setError("");

      let finalImages = existingImages;

      if (newImages.length > 0) {
        const uploadResult = await uploadRecipeImages(newImages);
        const uploadedImages = Array.isArray(uploadResult?.images)
          ? uploadResult.images
          : [];

        if (!uploadedImages.length) {
          throw new Error(
            "New images could not be uploaded. Please try again.",
          );
        }

        finalImages = uploadedImages;
      }

      const recipeData = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        mainCategory: category.trim(),
        difficulty: difficulty.trim(),
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        servings: Number(servings),
        serves: Number(servings),
        ingredients: ingredients.map((item) => item.trim()).filter(Boolean),
        steps: steps.map((item) => item.trim()).filter(Boolean),
        images: finalImages,
        image: finalImages[0] || "",
        nutrients: Object.fromEntries(
          Object.entries(nutrients).map(([key, value]) => [
            key,
            String(value).trim(),
          ]),
        ),
        recipeType: "community",
        isPublished,
      };

      await updateRecipe(id, recipeData);

      notify("Recipe updated successfully.", "success");
      navigate("/community", { replace: true });
    } catch (saveError) {
      console.error("Edit recipe error:", saveError);

      const message = saveError.message || "Failed to update recipe.";
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="create-recipe-page">
        <Header />
        <main className="create-recipe-container">
          <div className="community-loading">
            <div className="loading-spinner" />
            <p>Loading your recipe...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !authorized) {
    return (
      <div className="create-recipe-page">
        <Header />
        <main className="create-recipe-container">
          <button
            type="button"
            className="create-back-button"
            onClick={() => navigate("/community")}
          >
            ← Back to Community
          </button>
          <div className="form-error">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="create-recipe-page">
      <Header />

      <main className="create-recipe-container">
        <button
          type="button"
          className="create-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="create-recipe-heading">
          <span>YOUR RECIPE</span>
          <h1>Edit Recipe</h1>
          <p>Update your recipe details without changing its publish status.</p>
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <div className="edit-recipe-status">
          <span
            className={
              isPublished ? "status-dot published" : "status-dot draft"
            }
          />
          <span>
            {isPublished
              ? "This recipe is published"
              : "This recipe is a private draft"}
          </span>
        </div>

        <form className="create-recipe-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <div className="form-section-heading">
              <span>01</span>
              <div>
                <h2>Recipe Information</h2>
                <p>Update your recipe information.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="edit-name">Recipe Name</label>
                <input
                  id="edit-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Creamy Garlic Pasta"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your recipe..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-category">Category</label>
                <select
                  id="edit-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {["Recipes", "Baking", "Budget", "Inspiration", "Health"].map(
                    (item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-difficulty">Difficulty</label>
                <select
                  id="edit-difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                >
                  {["Easy", "Medium", "Hard"].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-prep">Preparation Time</label>
                <input
                  id="edit-prep"
                  value={prepTime}
                  onChange={(event) => setPrepTime(event.target.value)}
                  placeholder="20 mins"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-cook">Cooking Time</label>
                <input
                  id="edit-cook"
                  value={cookTime}
                  onChange={(event) => setCookTime(event.target.value)}
                  placeholder="30 mins"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-servings">Servings</label>
                <input
                  id="edit-servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  placeholder="4"
                  required
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <span>02</span>
              <div>
                <h2>Recipe Images</h2>
                <p>Choose new images to replace the current set.</p>
              </div>
            </div>

            {existingImages.length > 0 && (
              <div className="image-preview-grid">
                {existingImages.map((image, index) => (
                  <div className="image-preview" key={`${image}-${index}`}>
                    <img src={image} alt={`Current recipe ${index + 1}`} />
                    <span>
                      {index === 0 ? "Current Main" : `Current ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="image-upload-box">
              <input
                id="edit-recipe-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
              />
              <label htmlFor="edit-recipe-images">
                <span className="upload-icon">☁️</span>
                <strong>Replace recipe images</strong>
                <small>JPG, PNG or WEBP · Max 5MB each · Up to 6 images</small>
              </label>
            </div>

            {newPreviews.length > 0 && (
              <div className="image-preview-grid">
                {newPreviews.map((preview, index) => (
                  <div className="image-preview" key={preview}>
                    <img src={preview} alt={`New preview ${index + 1}`} />
                    <span>New {index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <span>03</span>
              <div>
                <h2>Ingredients</h2>
                <p>Update the ingredients.</p>
              </div>
            </div>

            <div className="dynamic-list">
              {ingredients.map((ingredient, index) => (
                <div className="dynamic-input-row" key={index}>
                  <span>{index + 1}</span>
                  <input
                    value={ingredient}
                    onChange={(event) =>
                      updateIngredient(index, event.target.value)
                    }
                    placeholder={`Ingredient ${index + 1}`}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-item-button"
              onClick={addIngredient}
            >
              + Add Ingredient
            </button>
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <span>04</span>
              <div>
                <h2>Cooking Method</h2>
                <p>Update your cooking instructions.</p>
              </div>
            </div>

            <div className="dynamic-list">
              {steps.map((step, index) => (
                <div className="step-input-row" key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <textarea
                    value={step}
                    onChange={(event) => updateStep(index, event.target.value)}
                    placeholder={`Step ${index + 1}`}
                    rows="3"
                  />
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(index)}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="add-item-button" onClick={addStep}>
              + Add Step
            </button>
          </section>

          <section className="form-section">
            <div className="form-section-heading">
              <span>05</span>
              <div>
                <h2>Nutrition</h2>
                <p>Update nutrition information per serving.</p>
              </div>
            </div>

            <div className="nutrition-form-grid">
              {[
                ["kcal", "Calories", "e.g. 450"],
                ["fat", "Fat", "e.g. 18g"],
                ["saturates", "Saturates", "e.g. 7g"],
                ["carbs", "Carbs", "e.g. 55g"],
                ["sugars", "Sugars", "e.g. 12g"],
                ["fibre", "Fibre", "e.g. 6g"],
                ["protein", "Protein", "e.g. 22g"],
                ["salt", "Salt", "e.g. 1.2g"],
              ].map(([field, label, placeholder]) => (
                <div className="form-group" key={field}>
                  <label htmlFor={`edit-nutrient-${field}`}>{label}</label>
                  <input
                    id={`edit-nutrient-${field}`}
                    value={nutrients[field]}
                    onChange={(event) =>
                      updateNutrient(field, event.target.value)
                    }
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="create-form-actions">
            <button
              type="button"
              className="cancel-recipe-button"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="publish-recipe-button"
              disabled={saving || !authorized}
            >
              {saving ? "Saving Changes..." : "Save Changes →"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditRecipe;
