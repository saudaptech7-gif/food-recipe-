/* eslint-disable no-undef */
require("dotenv").config();

const mongoose = require("mongoose");
const Recipe = require("./models/Recipe");

// ======================================================
// SAFETY SWITCH
// ======================================================
//
// true  = sirf duplicates show karega, DELETE nahi karega
// false = duplicates actually DELETE karega
//
// PEHLE true KE SAATH RUN KARO.
// Output check karne ke baad false karo.
// ======================================================

const DRY_RUN = true;

// ======================================================
// NORMALIZE TEXT
// ======================================================

const normalizeText = (value = "") => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

// ======================================================
// GET FIRST IMAGE
// ======================================================

const getFirstImage = (recipe) => {
  if (recipe.image) {
    return String(recipe.image).trim();
  }

  if (
    Array.isArray(recipe.images) &&
    recipe.images.length > 0
  ) {
    return String(recipe.images[0]).trim();
  }

  return "";
};

// ======================================================
// CREATE DUPLICATE KEY
// ======================================================

const createDuplicateKey = (recipe) => {
  const name = normalizeText(recipe.name);

  const author = normalizeText(recipe.author);

  const description = normalizeText(recipe.description);

  const image = getFirstImage(recipe);

  return [
    name,
    author,
    description,
    image,
  ].join("|");
};

// ======================================================
// MAIN CLEANUP
// ======================================================

const cleanupDuplicates = async () => {
  try {
    // ==================================================
    // CONNECT DATABASE
    // ==================================================

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from your .env file.",
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("");
    console.log("========================================");
    console.log("MongoDB Connected");
    console.log("========================================");
    console.log("");

    // ==================================================
    // GET ONLY ARCHIVE RECIPES
    // ==================================================

    const recipes = await Recipe.find({
      $or: [
        {
          recipeType: "archive",
        },
        {
          recipeType: {
            $exists: false,
          },
        },
        {
          recipeType: null,
        },
      ],
    })
      .sort({
        createdAt: 1,
        _id: 1,
      })
      .lean();

    console.log(
      `Total archive recipes found: ${recipes.length}`,
    );

    console.log("");

    // ==================================================
    // FIND DUPLICATES
    // ==================================================

    const recipeGroups = new Map();

    for (const recipe of recipes) {
      const key = createDuplicateKey(recipe);

      if (!recipeGroups.has(key)) {
        recipeGroups.set(key, []);
      }

      recipeGroups.get(key).push(recipe);
    }

    // ==================================================
    // COLLECT DUPLICATE GROUPS
    // ==================================================

    const duplicateGroups = [];

    for (const [key, group] of recipeGroups.entries()) {
      if (group.length > 1) {
        duplicateGroups.push({
          key,
          recipes: group,
        });
      }
    }

    // ==================================================
    // NO DUPLICATES
    // ==================================================

    if (duplicateGroups.length === 0) {
      console.log("========================================");
      console.log("No duplicate archive recipes found.");
      console.log("========================================");

      await mongoose.disconnect();

      return;
    }

    // ==================================================
    // SHOW DUPLICATES
    // ==================================================

    console.log("========================================");
    console.log(
      `Duplicate groups found: ${duplicateGroups.length}`,
    );
    console.log("========================================");
    console.log("");

    let totalDuplicates = 0;

    const idsToDelete = [];

    duplicateGroups.forEach((group, index) => {
      console.log("----------------------------------------");

      console.log(
        `Duplicate Group #${index + 1}`,
      );

      console.log("----------------------------------------");

      console.log(
        `Recipe Name: ${group.recipes[0].name}`,
      );

      console.log(
        `Copies Found: ${group.recipes.length}`,
      );

      console.log("");

      /*
       * First recipe is preserved.
       *
       * Because recipes are sorted by createdAt ASC,
       * oldest recipe will be kept.
       */

      const recipeToKeep = group.recipes[0];

      console.log(
        `KEEP: ${recipeToKeep._id}`,
      );

      console.log(
        `KEEP ID: ${recipeToKeep.id || "(empty)"}`,
      );

      console.log("");

      // ==================================================
      // MARK OTHER COPIES FOR DELETE
      // ==================================================

      group.recipes.slice(1).forEach((duplicate) => {
        console.log(
          `DELETE: ${duplicate._id}`,
        );

        console.log(
          `DELETE ID: ${duplicate.id || "(empty)"}`,
        );

        console.log(
          `DELETE NAME: ${duplicate.name}`,
        );

        console.log("");

        idsToDelete.push(duplicate._id);

        totalDuplicates++;
      });
    });

    // ==================================================
    // SUMMARY
    // ==================================================

    console.log("========================================");
    console.log("CLEANUP SUMMARY");
    console.log("========================================");

    console.log(
      `Duplicate groups: ${duplicateGroups.length}`,
    );

    console.log(
      `Documents to delete: ${totalDuplicates}`,
    );

    console.log(
      `Documents to keep: ${duplicateGroups.length}`,
    );

    console.log("");

    // ==================================================
    // DRY RUN
    // ==================================================

    if (DRY_RUN) {
      console.log("========================================");
      console.log("DRY RUN MODE");
      console.log("========================================");

      console.log(
        "Nothing was deleted.",
      );

      console.log("");

      console.log(
        "Agar ye duplicates correct hain,",
      );

      console.log(
        "DRY_RUN = false karke script dobara run karo.",
      );

      console.log("");

      await mongoose.disconnect();

      return;
    }

    // ==================================================
    // DELETE DUPLICATES
    // ==================================================

    if (idsToDelete.length > 0) {
      const deleteResult = await Recipe.deleteMany({
        _id: {
          $in: idsToDelete,
        },
      });

      console.log("========================================");
      console.log("DELETE COMPLETE");
      console.log("========================================");

      console.log(
        `Deleted documents: ${deleteResult.deletedCount}`,
      );
    }

    // ==================================================
    // DISCONNECT
    // ==================================================

    await mongoose.disconnect();

    console.log("");
    console.log("MongoDB disconnected.");
    console.log("Cleanup finished successfully.");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("CLEANUP ERROR");
    console.error("========================================");

    console.error(error);

    await mongoose.disconnect();
    process.exit(1);
  }
};

// ======================================================
// RUN
// ======================================================

cleanupDuplicates();

