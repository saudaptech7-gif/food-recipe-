import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";

import { createRecipe, uploadRecipeImages } from "../services/recipeApi";

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

function CreateRecipe() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

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

  const [nutrients, setNutrients] = useState(initialNutrients);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // ===============================
  // IMAGE SELECTION
  // ===============================
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
    setImages(selected);

    const newPreviews = selected.map((image) => URL.createObjectURL(image));

    setPreviews(newPreviews);
  };

  // ===============================
  // INGREDIENTS
  // ===============================
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

  // ===============================
  // STEPS
  // ===============================
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

  // ===============================
  // NUTRITION
  // ===============================
  const updateNutrient = (field, value) => {
    setNutrients((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ===============================
  // VALIDATION
  // ===============================
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
      return "Please add at least one step.";
    }

    return "";
  };

  // ===============================
  // SUBMIT RECIPE
  // ===============================
  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // --------------------------------
      // STEP 1: Upload images
      // --------------------------------
      console.log("Uploading images...");

      const uploadResult = await uploadRecipeImages(images);

      console.log("Cloudinary upload result:", uploadResult);

      const uploadedImages = Array.isArray(uploadResult?.images)
        ? uploadResult.images
        : [];

      if (uploadedImages.length === 0) {
        throw new Error("Images uploaded nahi hui. Please try again.");
      }

      // --------------------------------
      // STEP 2: Clean form data
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
      // STEP 3: Prepare recipe data
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

        images: uploadedImages,

        image: uploadedImages[0],

        nutrients: cleanNutrients,
      };

      console.log("Recipe data being sent to backend:", recipeData);

      // --------------------------------
      // STEP 4: Save recipe in MongoDB
      // --------------------------------
      const createdRecipe = await createRecipe(recipeData);

      console.log("Recipe successfully created:", createdRecipe);

      // --------------------------------
      // STEP 5: Go to community page
      // --------------------------------
      navigate("/community");
    } catch (submitError) {
      console.error("Create recipe error:", submitError);

      setError(
        submitError?.message || "Failed to create recipe. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
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
          <span>SHARE YOUR CREATION</span>

          <h1>Create a Recipe</h1>

          <p>Share your favorite recipe with the Savorly community.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form className="create-recipe-form" onSubmit={handleSubmit}>
          {/* BASIC INFO */}

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

          {/* IMAGES */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>02</span>

              <div>
                <h2>Recipe Images</h2>

                <p>
                  Upload up to 6 images. Your images are securely stored with
                  Cloudinary.
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
              />

              <label htmlFor="recipe-images">
                <span className="upload-icon">☁️</span>

                <strong>Choose recipe images</strong>

                <small>JPG, PNG or WEBP · Max 5MB each</small>
              </label>
            </div>

            {previews.length > 0 && (
              <div className="image-preview-grid">
                {previews.map((preview, index) => (
                  <div className="image-preview" key={preview}>
                    <img src={preview} alt={`Preview ${index + 1}`} />

                    <span>{index === 0 ? "Main" : index + 1}</span>
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

          {/* STEPS */}

          <section className="form-section">
            <div className="form-section-heading">
              <span>04</span>

              <div>
                <h2>Cooking Method</h2>

                <p>Add your cooking steps in the correct order.</p>
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

          {/* ACTIONS */}

          <div className="create-form-actions">
            <button
              type="button"
              className="cancel-recipe-button"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="publish-recipe-button"
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Recipe →"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateRecipe;
