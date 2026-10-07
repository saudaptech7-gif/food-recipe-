/* eslint-disable no-undef */
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

const nutrientSchema = new mongoose.Schema(
  {
    kcal: {
      type: String,
      default: "",
    },

    fat: {
      type: String,
      default: "",
    },

    saturates: {
      type: String,
      default: "",
    },

    carbs: {
      type: String,
      default: "",
    },

    sugars: {
      type: String,
      default: "",
    },

    fibre: {
      type: String,
      default: "",
    },

    protein: {
      type: String,
      default: "",
    },

    salt: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const recipeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images) {
          return images.length <= 6;
        },
        message: "A recipe can have maximum 6 images.",
      },
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    author: {
      type: String,
      default: "",
    },

    ingredients: {
      type: [String],
      default: [],
    },

    steps: {
      type: [String],
      default: [],
    },

    nutrients: {
      type: nutrientSchema,
      default: () => ({}),
    },

    times: {
      preparation: {
        type: String,
        default: "",
      },

      cooking: {
        type: String,
        default: "",
      },
    },

    prepTime: {
      type: String,
      default: "",
      trim: true,
    },

    cookTime: {
      type: String,
      default: "",
      trim: true,
    },

    serves: {
      type: Number,
      default: 0,
    },

    servings: {
      type: Number,
      default: 0,
    },

    difficulty: {
      type: String,
      default: "",
      trim: true,
    },

    subcategory: {
      type: String,
      default: "",
      trim: true,
    },

    dishType: {
      type: String,
      default: "",
      trim: true,
    },

    mainCategory: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    recipeType: {
      type: String,
      enum: ["archive", "community"],
      default: "archive",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    voteCount: {
      type: Number,
      default: 0,
    },

    ratings: {
      type: [ratingSchema],
      default: [],
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

recipeSchema.index({
  name: "text",
  description: "text",
  author: "text",
  category: "text",
  mainCategory: "text",
  subcategory: "text",
  dishType: "text",
  difficulty: "text",
});

module.exports = mongoose.model("Recipe", recipeSchema);
