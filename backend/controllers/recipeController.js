// controllers/recipeController.js

const asyncHandler = require("express-async-handler");
const Recipe = require("../models/Recipe");
const User = require("../models/User");

// @desc    Get all recipes with optional search and filters
// @route   GET /api/recipes
// @access  Public
const getRecipes = asyncHandler(async (req, res) => {
  const {
    search,
    cuisine,
    mealType,
    difficulty,
    author,
    page = 1,
    limit = 9,
  } = req.query;

  const filter = {};

  // Search
  if (search) {
    filter.$text = { $search: search };
  }

  // Filters
  if (cuisine) filter.cuisine = cuisine;
  if (mealType) filter.mealType = mealType;
  if (difficulty) filter.difficulty = difficulty;

  // Author filter
  if (author) {
  filter.author = author;
}

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.max(Number(limit), 1);

  const total = await Recipe.countDocuments(filter);

  let recipes;

  if (search) {
    /*
      Search results:
      1. Exact title match
      2. Title starts with search
      3. Title contains search
      4. Other text matches
    */

    const allMatches = await Recipe.find(filter)
      .populate("author", "name profilePicture")
      .select("+title")
      .sort({ score: { $meta: "textScore" } });

    const searchText = search.trim().toLowerCase();

    allMatches.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      const getPriority = (title) => {
        if (title === searchText) return 4;
        if (title.startsWith(searchText)) return 3;
        if (title.includes(searchText)) return 2;
        return 1;
      };

      const aPriority = getPriority(aTitle);
      const bPriority = getPriority(bTitle);

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return (b._doc.score || 0) - (a._doc.score || 0);
    });

    const start = (pageNumber - 1) * limitNumber;
    const end = start + limitNumber;

    recipes = allMatches.slice(start, end);
  } else {
    const skip = (pageNumber - 1) * limitNumber;

    recipes = await Recipe.find(filter)
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);
  }

  res.json({
    success: true,
    total,
    page: pageNumber,
    pages: Math.ceil(total / limitNumber),
    data: recipes,
  });
});

// @desc    Get a single recipe by its ID
// @route   GET /api/recipes/:id
// @access  Public
const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate("author", "name profilePicture email")
    .populate("reviews.user", "name profilePicture");

  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  res.json({ success: true, data: recipe });
});

// @desc    Create a new recipe
// @route   POST /api/recipes
// @access  Private
const createRecipe = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    cuisine,
    mealType,
    difficulty,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
  } = req.body;

  const image = req.file ? req.file.path : undefined;

  const parsedIngredients =
    typeof ingredients === "string"
      ? JSON.parse(ingredients)
      : ingredients;

  const parsedInstructions =
    typeof instructions === "string"
      ? JSON.parse(instructions)
      : instructions;

  const recipe = await Recipe.create({
    author: req.user._id,
    source: "user",
    title,
    description,
    cuisine,
    mealType,
    difficulty,
    ingredients: parsedIngredients,
    instructions: parsedInstructions,
    prepTime: Number(prepTime),
    cookTime: Number(cookTime),
    servings: Number(servings),
    image,
  });

  res.status(201).json({
    success: true,
    data: recipe,
  });
});

// @desc    Update a recipe
// @route   PUT /api/recipes/:id
// @access  Private
const updateRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  if (recipe.author.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to update this recipe");
  }

  const image = req.file ? req.file.path : recipe.image;

  const {
    title,
    description,
    cuisine,
    mealType,
    difficulty,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
  } = req.body;

  const parsedIngredients =
    typeof ingredients === "string"
      ? JSON.parse(ingredients)
      : ingredients || recipe.ingredients;

  const parsedInstructions =
    typeof instructions === "string"
      ? JSON.parse(instructions)
      : instructions || recipe.instructions;

  recipe.title = title || recipe.title;
  recipe.description = description || recipe.description;
  recipe.cuisine = cuisine || recipe.cuisine;
  recipe.mealType = mealType || recipe.mealType;
  recipe.difficulty = difficulty || recipe.difficulty;
  recipe.ingredients = parsedIngredients;
  recipe.instructions = parsedInstructions;
  recipe.prepTime = prepTime ? Number(prepTime) : recipe.prepTime;
  recipe.cookTime = cookTime ? Number(cookTime) : recipe.cookTime;
  recipe.servings = servings ? Number(servings) : recipe.servings;
  recipe.image = image;

  const updatedRecipe = await recipe.save();

  res.json({
    success: true,
    data: updatedRecipe,
  });
});

// @desc    Delete a recipe
// @route   DELETE /api/recipes/:id
// @access  Private
const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  if (recipe.author.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to delete this recipe");
  }

  await recipe.deleteOne();

  res.json({
    success: true,
    message: "Recipe deleted successfully",
  });
});

// @desc    Add a review to a recipe
// @route   POST /api/recipes/:id/reviews
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  const alreadyReviewed = recipe.reviews.find(
  (r) =>
    r.user &&
    req.user &&
    req.user._id &&
    r.user.toString() === req.user._id.toString()
);

  if (alreadyReviewed) {
    res.status(400);
    throw new Error("You have already reviewed this recipe");
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  recipe.reviews.push(review);
  recipe.numReviews = recipe.reviews.length;

  recipe.averageRating =
    recipe.reviews.reduce((acc, r) => acc + r.rating, 0) /
    recipe.reviews.length;

  await recipe.save();

  res.status(201).json({
    success: true,
    message: "Review added",
  });
});

// @desc    Save or unsave a recipe
// @route   POST /api/recipes/:id/save
// @access  Private
const toggleSaveRecipe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const recipeId = req.params.id;

  const alreadySaved = user.savedRecipes.some(
    (id) => id.toString() === recipeId
  );

  if (alreadySaved) {
    user.savedRecipes = user.savedRecipes.filter(
      (id) => id.toString() !== recipeId
    );
  } else {
    user.savedRecipes.push(recipeId);
  }

  await user.save();

  res.json({
    success: true,
    saved: !alreadySaved,
    message: alreadySaved
      ? "Recipe removed from saved"
      : "Recipe saved",
  });
});

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addReview,
  toggleSaveRecipe,
};