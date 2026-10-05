/* eslint-disable no-undef */
// eslint-disable-next-line no-undef

const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    _id: false,
  },
);

const recipeSchema = new mongoose.Schema(
  {
    // =========================
    // Archive Recipe Fields
    // =========================

    id: String,

    url: String,

    image: String,

    name: String,

    description: String,

    author: String,

    rating: Number,

    voteCount: Number,

    ingredients: [String],

    steps: [String],

    nutrients: {
      kcal: String,
      fat: String,
      saturates: String,
      carbs: String,
      sugars: String,
      fibre: String,
      protein: String,
      salt: String,
    },

    times: {
      preparation: String,
      cooking: String,
    },

    serves: Number,

    difficulty: String,

    subcategory: String,

    dishType: String,

    mainCategory: String,

    // =========================
    // Community Recipe Fields
    // =========================

    recipeType: {
      type: String,
      enum: ["archive", "community"],
      default: "archive",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    images: {
      type: [String],
      validate: {
        validator: function (images) {
          return images.length <= 6;
        },
        message: "A recipe can have maximum 6 images.",
      },
    },

    category: String,

    prepTime: String,

    cookTime: String,

    servings: Number,

    // =========================
    // Rating System
    // =========================

    ratings: {
      type: [ratingSchema],
      default: [],
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// eslint-disable-next-line no-undef

module.exports = mongoose.model("Recipe", recipeSchema);
