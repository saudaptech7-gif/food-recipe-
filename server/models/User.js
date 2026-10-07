/* eslint-disable no-undef */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    chef: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    /*
      Favorites contain recipe identifiers.

      Archive recipe:
      recipe.id

      Community recipe:
      recipe._id.toString()
    */
    favorites: {
      type: [String],
      default: [],
    },
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
