/* eslint-disable no-undef */
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  toggleFollow,
  getRecipeSocial,
  toggleRecipeLike,
  getLikedRecipes,
  addRecipeComment,
  deleteRecipeComment,
} = require("../controllers/socialController");

// My profile
router.get("/profile", authMiddleware, getMyProfile);

router.patch("/profile", authMiddleware, updateMyProfile);

// Another user's public profile
router.get("/profile/:userId", authMiddleware, getPublicProfile);

// Follow / unfollow
router.post("/follow/:userId", authMiddleware, toggleFollow);

// Liked community recipes
router.get("/liked-recipes", authMiddleware, getLikedRecipes);

// Recipe social information
router.get("/recipes/:recipeId/social", authMiddleware, getRecipeSocial);

// Like / unlike recipe
router.post("/recipes/:recipeId/like", authMiddleware, toggleRecipeLike);

// Add comment
router.post("/recipes/:recipeId/comments", authMiddleware, addRecipeComment);

// Delete comment
router.delete(
  "/recipes/:recipeId/comments/:commentId",
  authMiddleware,
  deleteRecipeComment,
);

module.exports = router;
