// eslint-disable-next-line no-undef
const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
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
});

// eslint-disable-next-line no-undef
module.exports = mongoose.model("Recipe", recipeSchema);
