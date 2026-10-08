import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";

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

  // ==================================================
  // AUTH CHECK
  // ==================================================

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // ==================================================
  // LOAD RECIPE
  // ==================================================

  useEffect(() => {
    if (!isLoggedIn || !id) {
      return;
    }

    const loadRecipe = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRecipeById(id);

        const recipe = data?.recipe || data;

        if (!recipe) {
          throw new Error("Recipe not found.");
        }

        setName(recipe.name || "");

        setDescription(recipe.description || "");

        setCategory(
          recipe.mainCategory ||
            recipe.maincategory ||
            recipe.category ||
            "Recipes",
        );

        setDifficulty(recipe.difficulty || "Easy");

        setPrepTime(recipe.prepTime || recipe.times?.preparation || "");

        setCookTime(recipe.cookTime || recipe.times?.cooking || "");

        setServings(recipe.servings || recipe.serves || "");

        setIngredients(
          Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
            ? recipe.ingredients
            : [""],
        );

        setSteps(
          Array.isArray(recipe.steps) && recipe.steps.length > 0
            ? recipe.steps
            : [""],
        );

        setNutrients({
          kcal: recipe.nutrients?.kcal || "",

          fat: recipe.nutrients?.fat || "",

          saturates: recipe.nutrients?.saturates || "",

          carbs: recipe.nutrients?.carbs || "",

          sugars: recipe.nutrients?.sugars || "",

          fibre: recipe.nutrients?.fibre || "",

          protein: recipe.nutrients?.protein || "",

          salt: recipe.nutrients?.salt || "",
        });

        const recipeImages = Array.isArray(recipe.images)
          ? recipe.images.filter(Boolean)
          : recipe.image
            ? [recipe.image]
            : [];

        setExistingImages(recipeImages);

        setIsPublished(Boolean(recipe.isPublished));
      } catch (loadError) {
        console.error("Load recipe error:", loadError);

        setError(loadError.message || "Failed to load recipe.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [id, isLoggedIn]);

  // ==================================================
  // NEW IMAGE SELECTION
  // ==================================================

  const handleImages = (event) => {
    const selected = Array.from(event.target.files || []);

    if (selected.length === 0) {
      return;
    }

    if (selected.length > 6) {
      setError("You can select maximum 6 images.");

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

    setError("");

    setNewImages(selected);

    const previews = selected.map((image) => URL.createObjectURL(image));

    setNewPreviews(previews);
  };

  // ==================================================
  // INGREDIENTS
  // ==================================================

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

  // ==================================================
  // STEPS
  // ==================================================

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

  // ==================================================
  // NUTRITION
  // ==================================================

  const updateNutrient = (field, value) => {
    setNutrients((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==================================================
  // VALIDATION
  // ==================================================

  const validate = () => {
    if (!name.trim()) {
      return "Recipe name is required.";
    }

    if (!description.trim()) {
      return "Recipe description is required.";
    }

    if (!category.trim()) {
      return "Please select a category.";
    }

    if (!difficulty.trim()) {
      return "Please select difficulty.";
    }

    if (!prepTime.trim()) {
      return "Preparation time is required.";
    }

    if (!cookTime.trim()) {
      return "Cooking time is required.";
    }

    if (!servings || Number(servings) <= 0) {
      return "Please enter valid servings.";
    }

    const cleanIngredients = ingredients
      .map((item) => item.trim())
      .filter(Boolean);

    if (cleanIngredients.length === 0) {
      return "Please add at least one ingredient.";
    }

    const cleanSteps = steps.map((item) => item.trim()).filter(Boolean);

    if (cleanSteps.length === 0) {
      return "Please add at least one step.";
    }

    if (existingImages.length === 0 && newImages.length === 0) {
      return "Please keep at least one recipe image.";
    }

    return "";
  };

  // ==================================================
  // SAVE RECIPE
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      let finalImages = existingImages;

      // --------------------------------
      // Upload new images if selected
      // --------------------------------

      if (newImages.length > 0) {
        const uploadResult = await uploadRecipeImages(newImages);

        const uploadedImages = Array.isArray(uploadResult?.images)
          ? uploadResult.images
          : [];

        if (uploadedImages.length === 0) {
          throw new Error("New images upload nahi hui. Please try again.");
        }

        finalImages = uploadedImages;
      }

      // --------------------------------
      // Clean data
      // --------------------------------

      const cleanIngredients = ingredients
        .map((item) => item.trim())
        .filter(Boolean);

      const cleanSteps = steps.map((item) => item.trim()).filter(Boolean);

      const cleanNutrients = {
        kcal: nutrients.kcal.trim(),

        fat: nutrients.fat.trim(),

        saturates: nutrients.saturates.trim(),

        carbs: nutrients.carbs.trim(),

        sugars: nutrients.sugars.trim(),

        fibre: nutrients.fibre.trim(),

        protein: nutrients.protein.trim(),

        salt: nutrients.salt.trim(),
      };

      // --------------------------------
      // IMPORTANT
      //
      // isPublished is preserved.
      // Edit page does NOT publish
      // or unpublish the recipe.
      // --------------------------------

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

        ingredients: cleanIngredients,

        steps: cleanSteps,

        images: finalImages,

        image: finalImages[0] || "",

        nutrients: cleanNutrients,

        recipeType: "community",

        isPublished: isPublished,
      };

      console.log("Updated recipe data:", recipeData);

      // --------------------------------
      // Update backend
      // --------------------------------

      await updateRecipe(id, recipeData);

      // --------------------------------
      // Go back to My Recipes
      // --------------------------------

      navigate("/community");
    } catch (saveError) {
      console.error("Edit recipe error:", saveError);

      setError(saveError.message || "Failed to update recipe.");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // AUTH GUARD
  // ==================================================

  if (!isLoggedIn) {
    return null;
  }

  // ==================================================
  // LOADING
  // ==================================================

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

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="create-recipe-page">
      <Header />

      <main className="create-recipe-container">
        {/* BACK */}

        <button
          type="button"
          className="create-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        {/* HEADING */}

        <div className="create-recipe-heading">
          <span>YOUR RECIPE</span>

          <h1>Edit Recipe</h1>

          <p>Update your recipe details without changing its publish status.</p>
        </div>

        {/* ERROR */}

        {error && <div className="form-error">{error}</div>}

        {/* STATUS */}

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
          {/* =========================================
              BASIC INFO
          ========================================= */}

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
                <label>Recipe Name</label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Creamy Garlic Pasta"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your recipe..."
                  rows="5"
                />
              </div>

              <div className="form-group">
                <label>Category</label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="Recipes">Recipes</option>

                  <option value="Baking">Baking</option>

                  <option value="Budget">Budget</option>

                  <option value="Inspiration">Inspiration</option>

                  <option value="Health">Health</option>
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty</label>

                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                >
                  <option value="Easy">Easy</option>

                  <option value="Medium">Medium</option>

                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label>Preparation Time</label>

                <input
                  type="text"
                  value={prepTime}
                  onChange={(event) => setPrepTime(event.target.value)}
                  placeholder="20 mins"
                />
              </div>

              <div className="form-group">
                <label>Cooking Time</label>

                <input
                  type="text"
                  value={cookTime}
                  onChange={(event) => setCookTime(event.target.value)}
                  placeholder="30 mins"
                />
              </div>

              <div className="form-group">
                <label>Servings</label>

                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  placeholder="4"
                />
              </div>
            </div>
          </section>

          {/* =========================================
              IMAGES
          ========================================= */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>02</span>

              <div>
                <h2>Recipe Images</h2>

                <p>Keep your current images or upload new ones.</p>
              </div>
            </div>

            {existingImages.length > 0 && (
              <div className="image-preview-grid">
                {existingImages.map((image, index) => (
                  <div className="image-preview" key={image}>
                    <img src={image} alt={`Recipe ${index + 1}`} />

                    <span>{index === 0 ? "Current Main" : index + 1}</span>
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

                <small>JPG, PNG or WEBP · Max 5MB each</small>
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

          {/* =========================================
              INGREDIENTS
          ========================================= */}

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
                    type="text"
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

          {/* =========================================
              STEPS
          ========================================= */}

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

          {/* =========================================
              NUTRITION
          ========================================= */}

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
                  <label>{label}</label>

                  <input
                    type="text"
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

          {/* =========================================
              ACTIONS
          ========================================= */}

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
              disabled={saving}
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
