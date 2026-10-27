// backend/seedReviews.js
// Connects reviews from dataset/reviews.csv to recipes in MongoDB.

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const Recipe = require("./models/Recipe");

const RECIPES_CSV = path.join(__dirname, "dataset", "recipes.csv");
const REVIEWS_CSV = path.join(__dirname, "dataset", "reviews.csv");
const MAX_REVIEWS_PER_RECIPE = 10; // Max authentic reviews to attach per recipe

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (error.message.includes("whitelist") || error.message.includes("ReplicaSetNoPrimary")) {
      console.error("\n[!] MongoDB Atlas Whitelist Notice:");
      console.error("Your current IP is not whitelisted on MongoDB Atlas.");
      console.error("To fix this:");
      console.error("1. Go to cloud.mongodb.com -> Network Access -> Add IP Address.");
      console.error("2. Add '0.0.0.0/0' (allow from anywhere) or your current IP.");
      console.error("OR switch MONGO_URI in .env to local: mongodb://127.0.0.1:27017/foodrecipe\n");
    }
    process.exit(1);
  }
};

// Target-guided matching: only scans recipes.csv until needed titles are resolved
const mapRecipeTitlesToIds = (recipesMissingId) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(RECIPES_CSV)) {
      console.warn("recipes.csv not found, skipping title mapping.");
      return resolve(new Map());
    }

    console.log(`Reading recipes.csv to find Recipe IDs for ${recipesMissingId.length} recipe(s)...`);
    const neededMap = new Map();
    for (const r of recipesMissingId) {
      if (r.title) {
        const clean = r.title.trim().toLowerCase();
        if (!neededMap.has(clean)) {
          neededMap.set(clean, []);
        }
        neededMap.get(clean).push(r);
      }
    }

    let remainingNeeded = neededMap.size;
    const titleToId = new Map();
    let rowsScanned = 0;

    const readStream = fs.createReadStream(RECIPES_CSV);
    const parser = csv();

    readStream
      .pipe(parser)
      .on("data", (row) => {
        rowsScanned++;
        if (row.Name && row.RecipeId) {
          const clean = row.Name.trim().toLowerCase();
          if (neededMap.has(clean) && !titleToId.has(clean)) {
            titleToId.set(clean, Number(row.RecipeId));
            remainingNeeded--;
            if (remainingNeeded <= 0) {
              console.log(`Found all ${titleToId.size} recipe titles in the first ${rowsScanned} rows!`);
              readStream.destroy();
              resolve(titleToId);
            }
          }
        }
      })
      .on("end", () => {
        console.log(`Scanned ${rowsScanned} rows from recipes.csv. Matched ${titleToId.size} titles.`);
        resolve(titleToId);
      })
      .on("close", () => {
        resolve(titleToId);
      })
      .on("error", (err) => {
        console.error("Error reading recipes.csv:", err.message);
        reject(err);
      });
  });
};

const connectReviewsToRecipes = async () => {
  await connectDB();

  try {
    // 1. Find all recipes that need reviews
    console.log("Searching for recipes that need reviews...");
    const recipes = await Recipe.find({
      $or: [
        { reviews: { $size: 0 } },
        { reviews: { $exists: false } },
      ],
    });

    console.log(`Found ${recipes.length} recipe(s) without reviews.`);

    if (recipes.length === 0) {
      console.log("All recipes already have reviews attached! Nothing to do.");
      await mongoose.connection.close();
      return;
    }

    // 2. Check if recipes have recipeId; if not, match and batch-update them
    const recipesMissingId = recipes.filter((r) => !r.recipeId);

    if (recipesMissingId.length > 0) {
      const titleMap = await mapRecipeTitlesToIds(recipesMissingId);
      const idBulkOps = [];

      for (const recipe of recipesMissingId) {
        const cleanTitle = recipe.title ? recipe.title.trim().toLowerCase() : "";
        const matchedId = titleMap.get(cleanTitle);
        if (matchedId) {
          recipe.recipeId = matchedId;
          idBulkOps.push({
            updateOne: {
              filter: { _id: recipe._id },
              update: { $set: { recipeId: matchedId } },
            },
          });
        }
      }

      if (idBulkOps.length > 0) {
        console.log(`Saving matched recipe IDs for ${idBulkOps.length} recipe(s)...`);
        await Recipe.bulkWrite(idBulkOps);
      }
    }

    // 3. Build a map of target RecipeId -> Recipe documents
    const targetRecipeMap = new Map();
    let recipesWithIdCount = 0;

    for (const recipe of recipes) {
      if (recipe.recipeId) {
        const rId = Number(recipe.recipeId);
        if (!targetRecipeMap.has(rId)) {
          targetRecipeMap.set(rId, []);
        }
        targetRecipeMap.get(rId).push(recipe);
        recipesWithIdCount++;
      }
    }

    console.log(`Targeting ${targetRecipeMap.size} unique recipe ID(s) (${recipesWithIdCount} documents)...`);

    if (targetRecipeMap.size === 0) {
      console.warn("No recipes could be mapped to dataset Recipe IDs. Please check recipe titles.");
      await mongoose.connection.close();
      return;
    }

    if (!fs.existsSync(REVIEWS_CSV)) {
      console.error(`reviews.csv not found at: ${REVIEWS_CSV}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // 4. Stream reviews.csv and collect reviews for target recipes
    console.log("Streaming reviews.csv and extracting reviews...");
    const reviewsByRecipeId = new Map();
    let totalReviewsParsed = 0;
    let matchedReviewsCount = 0;

    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(REVIEWS_CSV);
      const parser = csv();

      readStream
        .pipe(parser)
        .on("data", (row) => {
          totalReviewsParsed++;
          if (totalReviewsParsed % 250000 === 0) {
            console.log(`Scanned ${(totalReviewsParsed / 1000).toFixed(0)}k reviews... matched ${matchedReviewsCount} so far.`);
          }

          const rId = Number(row.RecipeId);
          if (targetRecipeMap.has(rId)) {
            const currentList = reviewsByRecipeId.get(rId) || [];
            if (currentList.length < MAX_REVIEWS_PER_RECIPE) {
              const commentText = (row.Review || "").trim();
              if (commentText.length >= 3 && commentText !== "NA") {
                const ratingNum = Number(row.Rating);
                const validRating = !isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5
                  ? ratingNum
                  : 5;

                const reviewObj = {
                  name: (row.AuthorName || "Food Enthusiast").trim(),
                  rating: validRating,
                  comment: commentText,
                  createdAt: row.DateSubmitted ? new Date(row.DateSubmitted) : new Date(),
                  updatedAt: row.DateModified ? new Date(row.DateModified) : new Date(),
                };

                currentList.push(reviewObj);
                reviewsByRecipeId.set(rId, currentList);
                matchedReviewsCount++;
              }
            }
          }
        })
        .on("end", () => {
          console.log(`Finished reading reviews.csv (${totalReviewsParsed} rows scanned).`);
          console.log(`Collected ${matchedReviewsCount} authentic reviews across ${reviewsByRecipeId.size} recipes.`);
          resolve();
        })
        .on("close", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });
    });

    // 5. Update recipes in MongoDB with their connected reviews
    console.log("Writing connected reviews and updated ratings to MongoDB Atlas...");
    const bulkOps = [];

    for (const [rId, reviewsList] of reviewsByRecipeId.entries()) {
      const recipesToUpdate = targetRecipeMap.get(rId) || [];

      const totalRating = reviewsList.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = reviewsList.length > 0 ? Number((totalRating / reviewsList.length).toFixed(1)) : 0;

      for (const recipeDoc of recipesToUpdate) {
        bulkOps.push({
          updateOne: {
            filter: { _id: recipeDoc._id },
            update: {
              $set: {
                reviews: reviewsList,
                averageRating: avgRating,
                numReviews: reviewsList.length,
              },
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      const result = await Recipe.bulkWrite(bulkOps);
      console.log(`\nSUCCESS: Updated ${result.modifiedCount} recipe(s) with connected reviews!`);
    } else {
      console.log("No new reviews needed to be written.");
    }

    console.log("Review connection process finished successfully!");
  } catch (error) {
    console.error("Error connecting reviews:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

// Execute if run directly
if (require.main === module) {
  connectReviewsToRecipes();
}

module.exports = connectReviewsToRecipes;
