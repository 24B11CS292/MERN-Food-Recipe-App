
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
require("dotenv").config();

const Recipe = require("./models/Recipe");
const User = require("./models/User");

const filePath = "./dataset/recipes.csv";

const MAX_RECIPES = 5000;

// Connect MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Convert ISO duration to minutes
// Example: PT45M = 45
// Example: PT2H = 120
// Example: P1DT2H = 1560
const parseDuration = (value) => {
  if (!value) return 0;

  const match = value.match(
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?/
  );

  if (!match) return 0;

  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);

  return days * 1440 + hours * 60 + minutes;
};

// Cuisine mapping
const getCuisine = (category = "") => {
  const c = category.toLowerCase();

  if (c.includes("indian")) return "Indian";
  if (c.includes("italian")) return "Italian";
  if (c.includes("chinese")) return "Chinese";
  if (c.includes("mexican")) return "Mexican";

  if (
    c.includes("american") ||
    c.includes("southwest")
  ) {
    return "American";
  }

  return "Other";
};

// Meal type mapping
const getMealType = (category = "", keywords = "") => {
  const text = `${category} ${keywords}`.toLowerCase();

  if (text.includes("breakfast")) return "Breakfast";

  if (
    text.includes("dessert") ||
    text.includes("cookie") ||
    text.includes("cake")
  ) {
    return "Dessert";
  }

  if (
    text.includes("snack") ||
    text.includes("appetizer")
  ) {
    return "Snack";
  }

  if (text.includes("lunch")) return "Lunch";

  return "Dinner";
};

// Difficulty based on total cooking time
const getDifficulty = (prepTime, cookTime) => {
  const total =
    Number(prepTime || 0) +
    Number(cookTime || 0);

  if (total <= 30) return "Easy";
  if (total <= 90) return "Medium";

  return "Hard";
};

// Parse R-style arrays from CSV
const parseRList = (value) => {
  if (!value) return [];

  const text = value.trim();

  if (text.startsWith("c(") && text.endsWith(")")) {
    const content = text.slice(2, -1);

    const matches = content.match(/"([^"]*)"/g);

    if (matches) {
      return matches.map((item) =>
        item.slice(1, -1)
      );
    }
  }

  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}

  return [];
};

// Parse ingredients
const parseIngredients = (quantities, parts) => {
  const names = parseRList(parts);
  const amounts = parseRList(quantities);

  return names
    .map((name, index) => ({
      name: String(name).trim(),
      amount: String(amounts[index] || "").trim(),
    }))
    .filter((item) => item.name.length > 0);
};

// Parse instructions
const parseInstructions = (instructions) => {
  const steps = parseRList(instructions);

  return steps
    .map((step) => String(step).trim())
    .filter((step) => step.length > 0);
};

// Get first image URL
const getImage = (images) => {
  const imageList = parseRList(images);

  if (
    imageList.length > 0 &&
    imageList[0].trim() !== ""
  ) {
    return imageList[0].trim();
  }

  return null;
};

// Check whether image URL actually works
const isValidImage = async (url) => {
  if (!url) return false;

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 8000,
      maxContentLength: 5 * 1024 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const contentType =
      response.headers["content-type"] || "";

    if (
      response.status >= 200 &&
      response.status < 400 &&
      contentType.startsWith("image/")
    ) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

// Main seeding function
const seedDatabase = async () => {
  await connectDB();

  // Find or create dataset user
  let seedUser = await User.findOne({
    email: "dataset@foodrecipe.local",
  });

  if (!seedUser) {
    seedUser = await User.create({
      name: "Food Recipe Dataset",
      email: "dataset@foodrecipe.local",
      password: "dataset123456",
    });

    console.log("Dataset user created");
  }

  const recipes = [];

  console.log("Reading CSV...");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", async (row) => {
      // We don't process more rows after reaching limit
      if (recipes.length >= MAX_RECIPES) return;

      // Save rows temporarily
      recipes.push(row);
    })
    .on("end", async () => {
      try {
        console.log(
          `CSV loaded. Checking images...`
        );

        const validRecipes = [];

        for (
          let i = 0;
          i < recipes.length &&
          validRecipes.length < MAX_RECIPES;
          i++
        ) {
          const row = recipes[i];

          const image = getImage(row.Images);

          // Skip recipes without image URL
          if (!image) {
            continue;
          }

          // Check actual image
          const imageWorks =
            await isValidImage(image);

          if (!imageWorks) {
            console.log(
              `Skipping broken image: ${row.Name}`
            );
            continue;
          }

          const prepTime =
            parseDuration(row.PrepTime);

          const cookTime =
            parseDuration(row.CookTime);

          const ingredients =
            parseIngredients(
              row.RecipeIngredientQuantities,
              row.RecipeIngredientParts
            );

          const instructions =
            parseInstructions(
              row.RecipeInstructions
            );

          // Skip recipes without instructions
          if (instructions.length === 0) {
            continue;
          }

          const recipe = {
            author: seedUser._id,

            source: "dataset",

            recipeId: Number(row.RecipeId),

            title:
              row.Name ||
              "Untitled Recipe",

            description:
              row.Description ||
              "A delicious recipe.",

            image,

            cuisine:
              getCuisine(
                row.RecipeCategory
              ),

            mealType:
              getMealType(
                row.RecipeCategory,
                row.Keywords
              ),

            ingredients,

            instructions,

            prepTime,

            cookTime,

            servings:
              Number(row.RecipeServings) || 1,

            difficulty:
              getDifficulty(
                prepTime,
                cookTime
              ),

            averageRating:
              Number(row.AggregatedRating) || 0,

            numReviews:
              Number(row.ReviewCount) || 0,
          };

          validRecipes.push(recipe);

          console.log(
            `Valid recipes: ${validRecipes.length}/${MAX_RECIPES}`
          );
        }

        console.log(
          `Preparing ${validRecipes.length} recipes...`
        );

        // Delete ONLY old dataset recipes
        await Recipe.deleteMany({
          author: seedUser._id,
        });

        console.log(
          "Old dataset recipes removed. User recipes kept."
        );

        // Insert valid recipes
        if (validRecipes.length > 0) {
          await Recipe.insertMany(
            validRecipes
          );
        }

        console.log(
          `${validRecipes.length} dataset recipes inserted successfully`
        );

        await mongoose.connection.close();

        process.exit(0);
      } catch (error) {
        console.error(
          "Seeding failed:",
          error.message
        );

        await mongoose.connection.close();

        process.exit(1);
      }
    })
    .on("error", (error) => {
      console.error(
        "CSV reading error:",
        error.message
      );

      process.exit(1);
    });
};

seedDatabase();

