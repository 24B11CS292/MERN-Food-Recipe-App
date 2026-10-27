// models/Recipe.js
// Defines the structure of a Recipe document in MongoDB.

const mongoose = require("mongoose");

// Sub-schema for ingredients — each ingredient has a name and amount.
// We define it separately for clarity.
const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: false, default: "" },
});

// Sub-schema for a single review/rating left by a user
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: { type: String, required: true }, // Stored so we don't need an extra DB query to display reviewer name
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const recipeSchema = new mongoose.Schema(
  {
    // The user who created this recipe
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    source: {
      type: String,
      enum: ["user", "dataset"],
      default: "user",
    },
    recipeId: {
      type: Number,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Recipe title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    image: {
      type: String, // Cloudinary URL of the uploaded image
      default: "https://placehold.co/800x600?text=No+Image",
    },

    // Category of the dish — used for filtering
    cuisine: {
      type: String,
      required: true,
      enum: ["Indian", "Italian", "Chinese", "Mexican", "American", "Other"],
    },

    // Type of meal
    mealType: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"],
    },

    ingredients: [ingredientSchema], // Array of ingredient objects

    // Step-by-step cooking instructions as an array of strings
   instructions: [
  {
    type: String,
    required: false,
    default: "",
  },
],

    prepTime: { type: Number, required: true }, // in minutes
    cookTime: { type: Number, required: true }, // in minutes
    servings: { type: Number, required: true },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    reviews: [reviewSchema], // Array of review objects

    // Average rating — recalculated every time a new review is added
    averageRating: {
      type: Number,
      default: 0,
    },

    numReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// --- VIRTUAL FIELD ---
// "totalTime" is calculated on the fly from prepTime + cookTime.
// It's not stored in the DB — it's computed when accessed.
recipeSchema.virtual("totalTime").get(function () {
  return this.prepTime + this.cookTime;
});

// Allow virtual fields to appear when converting document to JSON
recipeSchema.set("toJSON", { virtuals: true });
recipeSchema.set("toObject", { virtuals: true });

// --- TEXT INDEX ---
// This enables MongoDB's full-text search on title and description.
// Used in the search functionality on the frontend.
recipeSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Recipe", recipeSchema);
