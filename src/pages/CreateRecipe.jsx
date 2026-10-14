/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";

import { createRecipe, uploadRecipeImages } from "../services/recipeApi";

// =====================================
// INITIAL NUTRITION VALUES
// =====================================

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

// =====================================
// CREATE RECIPE
// =====================================

function CreateRecipe() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = useSelector((state) =>
    Boolean(
      state.auth?.isLoggedIn ||
      state.auth?.isAuthenticated ||
      state.auth?.token ||
      state.auth?.user ||
      state.auth?.currentUser,
    ),
  );

  // Only the My Kitchen button should open this form.
  const fromMyKitchen = location.state?.fromMyKitchen === true;

  // =====================================
  // FORM STATE
  // =====================================

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState("Recipes");
  const [difficulty, setDifficulty] = useState("Easy");

  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);

  const [nutrients, setNutrients] = useState({
    ...initialNutrients,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================
  // AUTH CHECK
  // =====================================

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Release temporary image previews when they are
  // replaced or the component unmounts.
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);

  // =====================================
  // IMAGE SELECTION
  // =====================================

  const handleImages = (event) => {
    const selected = Array.from(event.target.files || []);

    if (selected.length === 0) {
      return;
    }

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

    setError("");
    setImages(selected);

    setPreviews(selected.map((image) => URL.createObjectURL(image)));
  };

  // =====================================
  // INGREDIENTS
  // =====================================

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

  // =====================================
  // COOKING STEPS
  // =====================================

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

  // =====================================
  // NUTRITION
  // =====================================

  const updateNutrient = (field, value) => {
    setNutrients((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =====================================
  // VALIDATION
  // =====================================

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

    if (images.length === 0) {
      return "Please upload at least one image.";
    }

    const cleanIngredients = ingredients
      .map((item) => item.trim())
      .filter(Boolean);

    if (cleanIngredients.length === 0) {
      return "Please add at least one ingredient.";
    }

    const cleanSteps = steps.map((item) => item.trim()).filter(Boolean);

    if (cleanSteps.length === 0) {
      return "Please add at least one cooking step.";
    }

    return "";
  };

  // =====================================
  // SUBMIT RECIPE
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // STEP 1: Upload images to Cloudinary.
      const uploadResult = await uploadRecipeImages(images);

      const uploadedImages = Array.isArray(uploadResult?.images)
        ? uploadResult.images
        : [];

      if (uploadedImages.length === 0) {
        throw new Error("Images upload nahi hui. Please try again.");
      }

      // STEP 2: Clean and prepare form data.
      const cleanIngredients = ingredients
        .map((item) => item.trim())
        .filter(Boolean);

      const cleanSteps = steps.map((item) => item.trim()).filter(Boolean);

      const cleanNutrients = Object.fromEntries(
        Object.entries(nutrients).map(([key, value]) => [key, value.trim()]),
      );

      // STEP 3: Prepare the community recipe.
      // The recipe is saved as an unpublished draft.
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

        images: uploadedImages,
        image: uploadedImages[0],

        nutrients: cleanNutrients,

        recipeType: "community",
        isPublished: false,
      };

      // STEP 4: Save the recipe.
      await createRecipe(recipeData);

      // STEP 5: Return to My Kitchen.
      // MyRecipes.jsx will load the latest recipe list.
      navigate("/my-recipes", {
        replace: true,
        state: {
          recipeCreated: true,
        },
      });
    } catch (submitError) {
      console.error("Create recipe error:", submitError);

      setError(
        submitError?.message || "Failed to create recipe. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // ROUTE GUARDS
  // =====================================

  if (!isLoggedIn) {
    return null;
  }

  if (!fromMyKitchen) {
    return <Navigate to="/my-recipes" replace />;
  }

  // =====================================
  // UI
  // =====================================

  return (
    <div className="create-recipe-page">
      <Header />

      <main className="create-recipe-container">
        {/* BACK BUTTON */}

        <button
          type="button"
          className="create-back-button"
          onClick={() => navigate("/my-recipes")}
          disabled={loading}
        >
          ← Back to My Kitchen
        </button>

        {/* HEADING */}

        <div className="create-recipe-heading">
          <span>SHARE YOUR CREATION</span>

          <h1>Create a Recipe</h1>

          <p>
            Add your ingredients, cooking steps and nutrition to build your
            personal recipe collection.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form className="create-recipe-form" onSubmit={handleSubmit}>
          {/* BASIC INFORMATION */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>01</span>

              <div>
                <h2>Recipe Information</h2>
                <p>Tell everyone what makes your recipe special.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="recipe-name">Recipe Name</label>

                <input
                  id="recipe-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Creamy Garlic Pasta"
                  maxLength={120}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="recipe-description">Description</label>

                <textarea
                  id="recipe-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your recipe..."
                  rows={5}
                  maxLength={2000}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="recipe-category">Category</label>

                <select
                  id="recipe-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Recipes">Recipes</option>
                  <option value="Baking">Baking</option>
                  <option value="Budget">Budget</option>
                  <option value="Inspiration">Inspiration</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="recipe-difficulty">Difficulty</label>

                <select
                  id="recipe-difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="recipe-prep-time">Preparation Time</label>

                <input
                  id="recipe-prep-time"
                  type="text"
                  value={prepTime}
                  onChange={(event) => setPrepTime(event.target.value)}
                  placeholder="20 mins"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="recipe-cook-time">Cooking Time</label>

                <input
                  id="recipe-cook-time"
                  type="text"
                  value={cookTime}
                  onChange={(event) => setCookTime(event.target.value)}
                  placeholder="30 mins"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="recipe-servings">Servings</label>

                <input
                  id="recipe-servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  placeholder="4"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </section>

          {/* IMAGES */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>02</span>

              <div>
                <h2>Recipe Images</h2>
                <p>
                  Upload up to 6 images. Each image must be smaller than 5 MB.
                </p>
              </div>
            </div>

            <div className="image-upload-box">
              <input
                id="recipe-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
                disabled={loading}
                required={images.length === 0}
              />

              <label htmlFor="recipe-images">
                <span className="upload-icon">☁️</span>

                <strong>Choose recipe images</strong>

                <small>JPG, PNG or WEBP · Maximum 6 images</small>
              </label>
            </div>

            {previews.length > 0 && (
              <div className="image-preview-grid">
                {previews.map((preview, index) => (
                  <div className="image-preview" key={preview}>
                    <img src={preview} alt={`Recipe preview ${index + 1}`} />

                    <span>{index === 0 ? "Main image" : index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* INGREDIENTS */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>03</span>

              <div>
                <h2>Ingredients</h2>
                <p>Add everything needed for your recipe.</p>
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
                    disabled={loading}
                  />

                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      disabled={loading}
                      aria-label={`Remove ingredient ${index + 1}`}
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
              disabled={loading}
            >
              + Add Ingredient
            </button>
          </section>

          {/* COOKING STEPS */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>04</span>

              <div>
                <h2>Cooking Method</h2>
                <p>Explain each step in the correct order.</p>
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
                    rows={3}
                    disabled={loading}
                  />

                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      disabled={loading}
                      aria-label={`Remove step ${index + 1}`}
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
              onClick={addStep}
              disabled={loading}
            >
              + Add Step
            </button>
          </section>

          {/* NUTRITION */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>05</span>

              <div>
                <h2>Nutrition</h2>
                <p>Add nutrition information per serving.</p>
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
                  <label htmlFor={`nutrition-${field}`}>{label}</label>

                  <input
                    id={`nutrition-${field}`}
                    type="text"
                    value={nutrients[field]}
                    onChange={(event) =>
                      updateNutrient(field, event.target.value)
                    }
                    placeholder={placeholder}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* FORM ACTIONS */}

          <div className="create-form-actions">
            <button
              type="button"
              className="cancel-recipe-button"
              onClick={() => navigate("/my-recipes")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="publish-recipe-button"
              disabled={loading}
            >
              {loading ? "Saving Recipe..." : "Save Recipe →"}
            </button>
          </div>

          <div className="create-recipe-draft-note">
            <span>💡</span>

            <p>
              Your recipe will be saved as a private draft. You can publish it
              later from <strong>My Kitchen</strong>.!
              
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateRecipe;
