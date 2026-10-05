import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { uploadRecipeImages, createRecipe } from "../services/recipeApi";

function CreateRecipe() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");

  const [images, setImages] = useState([]);

  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =========================
  // IMAGE SELECT
  // =========================

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.length > 6) {
      setMessage("You can select maximum 6 images.");
      return;
    }

    setImages(selectedFiles);
    setMessage("");
  };

  // =========================
  // REMOVE IMAGE
  // =========================

  const removeImage = (index) => {
    setImages((currentImages) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  // =========================
  // INGREDIENTS
  // =========================

  const handleIngredientChange = (index, value) => {
    const updatedIngredients = [...ingredients];

    updatedIngredients[index] = value;

    setIngredients(updatedIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length === 1) {
      return;
    }

    setIngredients(
      ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    );
  };

  // =========================
  // STEPS
  // =========================

  const handleStepChange = (index, value) => {
    const updatedSteps = [...steps];

    updatedSteps[index] = value;

    setSteps(updatedSteps);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index) => {
    if (steps.length === 1) {
      return;
    }

    setSteps(steps.filter((_, stepIndex) => stepIndex !== index));
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");

    if (images.length === 0) {
      setMessage("Please select at least one image.");
      return;
    }

    if (images.length > 6) {
      setMessage("You can upload maximum 6 images.");
      return;
    }

    const cleanIngredients = ingredients
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    const cleanSteps = steps.map((step) => step.trim()).filter(Boolean);

    if (cleanIngredients.length === 0) {
      setMessage("Please add at least one ingredient.");
      return;
    }

    if (cleanSteps.length === 0) {
      setMessage("Please add at least one cooking step.");
      return;
    }

    try {
      setLoading(true);

      // 1. Upload images to Cloudinary
      const imageResponse = await uploadRecipeImages(images);

      // 2. Save recipe in MongoDB
      await createRecipe({
        name,
        description,
        images: imageResponse.images,
        ingredients: cleanIngredients,
        steps: cleanSteps,
        category,
        difficulty,
        prepTime,
        cookTime,
        servings,
      });

      setMessage("Recipe published successfully!");

      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (error) {
      console.error("Create recipe error:", error);

      setMessage(error.message || "Failed to create recipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-recipe-page">
      <div className="create-recipe-container">
        {/* HEADER */}

        <div className="create-recipe-header">
          <span className="create-recipe-badge">SHARE YOUR RECIPE</span>

          <h1>Create Your Recipe</h1>

          <p>Share your favorite recipe with the FoodRecipe community.</p>
        </div>

        <form className="create-recipe-form" onSubmit={handleSubmit}>
          {/* =========================
              RECIPE INFORMATION
          ========================= */}

          <section className="recipe-section">
            <div className="section-heading">
              <span className="section-number">01</span>

              <div>
                <h2>Recipe Information</h2>
                <p>Tell us about your recipe.</p>
              </div>
            </div>

            <div className="form-group">
              <label>Recipe Name</label>

              <input
                type="text"
                placeholder="e.g. Creamy Chicken Pasta"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>

              <textarea
                placeholder="Tell people what makes your recipe special..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>

            <div className="form-grid three-columns">
              <div className="form-group">
                <label>Category</label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                >
                  <option value="">Select category</option>

                  <option value="Breakfast">Breakfast</option>

                  <option value="Lunch">Lunch</option>

                  <option value="Dinner">Dinner</option>

                  <option value="Dessert">Dessert</option>

                  <option value="Snack">Snack</option>

                  <option value="Drinks">Drinks</option>

                  <option value="Baking">Baking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty</label>

                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  required
                >
                  <option value="">Select difficulty</option>

                  <option value="Easy">Easy</option>

                  <option value="Medium">Medium</option>

                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label>Servings</label>

                <input
                  type="number"
                  min="1"
                  placeholder="4"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid two-columns">
              <div className="form-group">
                <label>Preparation Time</label>

                <input
                  type="text"
                  placeholder="20 min"
                  value={prepTime}
                  onChange={(event) => setPrepTime(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cooking Time</label>

                <input
                  type="text"
                  placeholder="40 min"
                  value={cookTime}
                  onChange={(event) => setCookTime(event.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          {/* =========================
              IMAGES
          ========================= */}

          <section className="recipe-section">
            <div className="section-heading">
              <span className="section-number">02</span>

              <div>
                <h2>Recipe Photos</h2>
                <p>Add up to 6 photos of your recipe.</p>
              </div>
            </div>

            <label className="upload-box">
              <div className="upload-icon">+</div>

              <strong>Choose recipe photos</strong>

              <span>JPG, PNG or WEBP · Maximum 6 images</span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
            </label>

            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((image, index) => (
                  <div className="image-preview-card" key={index}>
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Recipe ${index + 1}`}
                    />

                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>

                    {index === 0 && <span className="cover-label">Cover</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* =========================
              INGREDIENTS
          ========================= */}

          <section className="recipe-section">
            <div className="section-heading">
              <span className="section-number">03</span>

              <div>
                <h2>Ingredients</h2>
                <p>List everything needed for your recipe.</p>
              </div>
            </div>

            <div className="dynamic-list">
              {ingredients.map((ingredient, index) => (
                <div className="dynamic-row" key={index}>
                  <span className="item-number">{index + 1}</span>

                  <input
                    type="text"
                    placeholder={`Ingredient ${index + 1}`}
                    value={ingredient}
                    onChange={(event) =>
                      handleIngredientChange(index, event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="delete-item"
                    onClick={() => removeIngredient(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-button"
              onClick={addIngredient}
            >
              + Add Ingredient
            </button>
          </section>

          {/* =========================
              STEPS
          ========================= */}

          <section className="recipe-section">
            <div className="section-heading">
              <span className="section-number">04</span>

              <div>
                <h2>Cooking Steps</h2>
                <p>Explain how to prepare your recipe.</p>
              </div>
            </div>

            <div className="dynamic-list">
              {steps.map((step, index) => (
                <div className="step-row" key={index}>
                  <span className="step-number">{index + 1}</span>

                  <textarea
                    placeholder={`Explain step ${index + 1}...`}
                    value={step}
                    onChange={(event) =>
                      handleStepChange(index, event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="delete-item"
                    onClick={() => removeStep(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="add-button" onClick={addStep}>
              + Add Step
            </button>
          </section>

          {/* MESSAGE */}

          {message && <div className="recipe-message">{message}</div>}

          {/* SUBMIT */}

          <div className="publish-area">
            <button type="submit" className="publish-button" disabled={loading}>
              {loading ? "Publishing Recipe..." : "Publish Recipe"}
            </button>

            <p>Your recipe will be shared with the FoodRecipe community.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRecipe;
