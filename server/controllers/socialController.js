const mongoose = require("mongoose");

const User = require("../models/User");
const Recipe = require("../models/Recipe");

// =====================================
// COMMON HELPERS
// =====================================

const toId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value._id || value.id || value.userId || null;
  }

  return value;
};

const idString = (value) => {
  const id = toId(value);
  return id ? String(id) : "";
};

const toObjectId = (value) => {
  const id = idString(value);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(id);
};

const getAuthenticatedUserId = (req) => {
  return (
    req.userId ||
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    null
  );
};

const requireUser = (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      message: "Not authenticated",
    });

    return null;
  }

  return userId;
};

const publicUser = (user, includeEmail = false) => {
  if (!user) {
    return null;
  }

  const result = {
    _id: idString(user._id),
    id: idString(user._id),
    name: user.name || "User",
    chef: user.chef || "",
    bio: user.bio || "",
    followers: Array.isArray(user.followers)
      ? user.followers.length
      : 0,
    following: Array.isArray(user.following)
      ? user.following.length
      : 0,
  };

  if (includeEmail) {
    result.email = user.email || "";
  }

  return result;
};

const getUser = async (id) => {
  const objectId = toObjectId(id);

  if (!objectId) {
    return null;
  }

  return User.collection.findOne({
    _id: objectId,
  });
};

const getCommunityRecipe = async (id) => {
  if (!id) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(String(id))) {
    const recipe = await Recipe.findOne({
      _id: id,
      recipeType: "community",
    }).lean();

    if (recipe) {
      return recipe;
    }
  }

  return Recipe.findOne({
    id: String(id),
    recipeType: "community",
  }).lean();
};

const normalizeIdArray = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(Boolean);
};

const sameId = (first, second) => {
  return idString(first) === idString(second);
};

// =====================================
// GET MY PROFILE
// =====================================

const getMyProfile = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) {
      return;
    }

    const user = await getUser(userId);

    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    return res.status(200).json({
      user: publicUser(user, true),
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      message: "Failed to load profile",
    });
  }
};

// =====================================
// UPDATE MY PROFILE
// =====================================

const updateMyProfile = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) {
      return;
    }

    const objectId = toObjectId(userId);

    if (!objectId) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const { name, chef, bio } = req.body;

    const cleanName = String(name ?? "").trim();
    const cleanChef = String(chef ?? "").trim();
    const cleanBio = String(bio ?? "").trim();

    if (!cleanName) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (cleanName.length > 80) {
      return res.status(400).json({
        message: "Name cannot exceed 80 characters",
      });
    }

    if (cleanChef.length > 40) {
      return res.status(400).json({
        message: "Chef name cannot exceed 40 characters",
      });
    }

    if (cleanBio.length > 280) {
      return res.status(400).json({
        message: "Bio cannot exceed 280 characters",
      });
    }

    await User.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          name: cleanName,
          chef: cleanChef,
          bio: cleanBio,
          updatedAt: new Date(),
        },
      },
    );

    const updatedUser = await getUser(objectId);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: publicUser(updatedUser, true),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

// =====================================
// GET PUBLIC PROFILE
// =====================================

const getPublicProfile = async (req, res) => {
  try {
    const currentUserId = requireUser(req, res);

    if (!currentUserId) {
      return;
    }

    const targetId = toObjectId(req.params.userId);

    if (!targetId) {
      return res.status(400).json({
        message: "Invalid profile ID",
      });
    }

    const targetUser = await getUser(targetId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    const currentUser = await getUser(currentUserId);

    const following = normalizeIdArray(
      currentUser?.following,
    );

    return res.status(200).json({
      user: publicUser(targetUser),
      isFollowing: following.some((id) =>
        sameId(id, targetId),
      ),
    });
  } catch (error) {
    console.error("Get public profile error:", error);

    return res.status(500).json({
      message: "Failed to load user profile",
    });
  }
};

// =====================================
// FOLLOW / UNFOLLOW USER
// =====================================

const toggleFollow = async (req, res) => {
  try {
    const currentUserId = requireUser(req, res);

    if (!currentUserId) {
      return;
    }

    const currentObjectId = toObjectId(currentUserId);
    const targetObjectId = toObjectId(req.params.userId);

    if (!currentObjectId || !targetObjectId) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (sameId(currentObjectId, targetObjectId)) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const currentUser = await getUser(currentObjectId);
    const targetUser = await getUser(targetObjectId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const following = normalizeIdArray(
      currentUser.following,
    );

    const alreadyFollowing = following.some((id) =>
      sameId(id, targetObjectId),
    );

    if (alreadyFollowing) {
      await User.collection.updateOne(
        { _id: currentObjectId },
        {
          $pull: {
            following: targetObjectId,
          },
        },
      );

      await User.collection.updateOne(
        { _id: targetObjectId },
        {
          $pull: {
            followers: currentObjectId,
          },
        },
      );
    } else {
      await User.collection.updateOne(
        { _id: currentObjectId },
        {
          $addToSet: {
            following: targetObjectId,
          },
        },
      );

      await User.collection.updateOne(
        { _id: targetObjectId },
        {
          $addToSet: {
            followers: currentObjectId,
          },
        },
      );
    }

    const updatedTarget = await getUser(targetObjectId);

    return res.status(200).json({
      message: alreadyFollowing
        ? "User unfollowed successfully"
        : "User followed successfully",
      following: !alreadyFollowing,
      user: publicUser(updatedTarget),
    });
  } catch (error) {
    console.error("Toggle follow error:", error);

    return res.status(500).json({
      message: "Failed to update follow status",
    });
  }
};

// =====================================
// GET RECIPE SOCIAL DATA
// =====================================

const getRecipeSocial = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) {
      return;
    }

    const recipe = await getCommunityRecipe(
      req.params.recipeId,
    );

    if (!recipe) {
      return res.status(404).json({
        message: "Community recipe not found",
      });
    }

    const likes = normalizeIdArray(recipe.likes);
    const rawComments = Array.isArray(recipe.comments)
      ? recipe.comments
      : [];

    const comments = await Promise.all(
      rawComments.map(async (comment) => {
        const commentUserId =
          comment.userId ||
          comment.user ||
          comment.createdBy;

        const commentUser = await getUser(commentUserId);

        return {
          _id: idString(comment._id),
          text: comment.text || "",
          createdAt: comment.createdAt || null,
          userId: idString(commentUserId),
          user: publicUser(commentUser),
        };
      }),
    );

    return res.status(200).json({
      likes: likes.length,
      likesCount: likes.length,
      likedByMe: likes.some((id) => sameId(id, userId)),
      comments,
    });
  } catch (error) {
    console.error("Get recipe social error:", error);

    return res.status(500).json({
      message: "Failed to load recipe social data",
    });
  }
};

// =====================================
// LIKE / UNLIKE COMMUNITY RECIPE
// =====================================

const toggleRecipeLike = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) {
      return;
    }

    const userObjectId = toObjectId(userId);

    if (!userObjectId) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const recipe = await getCommunityRecipe(
      req.params.recipeId,
    );

    if (!recipe) {
      return res.status(404).json({
        message: "Community recipe not found",
      });
    }

    const likes = normalizeIdArray(recipe.likes);
    const alreadyLiked = likes.some((id) =>
      sameId(id, userObjectId),
    );

    let updatedLikes;

    if (alreadyLiked) {
      updatedLikes = likes.filter(
        (id) => !sameId(id, userObjectId),
      );
    } else {
      updatedLikes = [...likes, userObjectId];
    }

    const recipeObjectId = toObjectId(recipe._id);

    await Recipe.collection.updateOne(
      { _id: recipeObjectId },
      {
        $set: {
          likes: updatedLikes,
        },
      },
    );

    return res.status(200).json({
      message: alreadyLiked
        ? "Recipe unliked successfully"
        : "Recipe liked successfully",
      likedByMe: !alreadyLiked,
      likes: updatedLikes.length,
      likesCount: updatedLikes.length,
    });
  } catch (error) {
    console.error("Toggle recipe like error:", error);

    return res.status(500).json({
      message: "Failed to update recipe like",
    });
  }
};

// =====================================
// GET LIKED RECIPES
// =====================================

const getLikedRecipes = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) {
      return;
    }

    /*
     * Mongoose query use ki hai.
     * Recipe.collection.find(...).sort(...) wala error
     * is implementation mein nahi aayega.
     *
     * Pehle community recipes load hoti hain, phir
     * un recipes ko filter kiya jata hai jin ki likes
     * array mein logged-in user ki ID maujood ho.
     */

    const communityRecipes = await Recipe.find({
      recipeType: "community",
    })
      .populate("createdBy", "name chef")
      .sort({
        createdAt: -1,
      })
      .lean();

    const recipes = communityRecipes.filter((recipe) => {
      const likes = Array.isArray(recipe.likes)
        ? recipe.likes
        : [];

      return likes.some((likedUserId) =>
        sameId(likedUserId, userId),
      );
    });

    return res.status(200).json({
      recipes,
    });
  } catch (error) {
    console.error("Get liked recipes error:", error);

    return res.status(500).json({
      message: "Failed to load liked recipes",
    });
  }
};

// =====================================
// ADD RECIPE COMMENT
// =====================================

const addRecipeComment = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) {
      return;
    }

    const userObjectId = toObjectId(userId);

    if (!userObjectId) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const text = String(req.body.text ?? "").trim();

    if (!text) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        message: "Comment cannot exceed 1000 characters",
      });
    }

    const recipe = await getCommunityRecipe(
      req.params.recipeId,
    );

    if (!recipe) {
      return res.status(404).json({
        message: "Community recipe not found",
      });
    }

    const comment = {
      _id: new mongoose.Types.ObjectId(),
      userId: userObjectId,
      user: userObjectId,
      text,
      createdAt: new Date(),
    };

    await Recipe.collection.updateOne(
      {
        _id: toObjectId(recipe._id),
      },
      {
        $push: {
          comments: comment,
        },
      },
    );

    const user = await getUser(userObjectId);

    return res.status(201).json({
      message: "Comment added successfully",
      comment: {
        _id: String(comment._id),
        userId: String(userObjectId),
        user: publicUser(user),
        text: comment.text,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error("Add recipe comment error:", error);

    return res.status(500).json({
      message: "Failed to add comment",
    });
  }
};

// =====================================
// DELETE RECIPE COMMENT
// =====================================

const deleteRecipeComment = async (req, res) => {
  try {
    const userId = requireUser(req, res);

    if (!userId) {
      return;
    }

    const recipe = await getCommunityRecipe(
      req.params.recipeId,
    );

    if (!recipe) {
      return res.status(404).json({
        message: "Community recipe not found",
      });
    }

    const comments = Array.isArray(recipe.comments)
      ? recipe.comments
      : [];

    const comment = comments.find((item) =>
      sameId(item._id, req.params.commentId),
    );

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const commentAuthorId =
      comment.userId ||
      comment.user ||
      comment.createdBy;

    const isCommentAuthor = sameId(
      commentAuthorId,
      userId,
    );

    const isRecipeOwner = sameId(
      recipe.createdBy,
      userId,
    );

    if (!isCommentAuthor && !isRecipeOwner) {
      return res.status(403).json({
        message: "You cannot delete this comment",
      });
    }

    const updatedComments = comments.filter(
      (item) =>
        !sameId(item._id, req.params.commentId),
    );

    await Recipe.collection.updateOne(
      {
        _id: toObjectId(recipe._id),
      },
      {
        $set: {
          comments: updatedComments,
        },
      },
    );

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete recipe comment error:", error);

    return res.status(500).json({
      message: "Failed to delete comment",
    });
  }
};

// =====================================
// EXPORTS
// =====================================

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  toggleFollow,
  getRecipeSocial,
  toggleRecipeLike,
  getLikedRecipes,
  addRecipeComment,
  deleteRecipeComment,
};