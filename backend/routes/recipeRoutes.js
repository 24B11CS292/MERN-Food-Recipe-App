// routes/recipeRoutes.js
// Maps URL paths to recipe controller functions.

const express = require("express");
const router = express.Router();
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addReview,
  toggleSaveRecipe,
} = require("../controllers/recipeController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

// GET  /api/recipes         — Get all recipes (with search/filter support)
// POST /api/recipes         — Create a new recipe (protected + image upload)
router
  .route("/")
  .get(getRecipes)
  .post(protect, upload.single("image"), createRecipe);
//              ^^^^^^^^^^^^^^^^^         ^^^^^^^^^^^^^
//              Multer middleware:         Then controller handles the data
//              handles the image upload

// GET    /api/recipes/:id   — Get one recipe
// PUT    /api/recipes/:id   — Update a recipe
// DELETE /api/recipes/:id   — Delete a recipe
router
  .route("/:id")
  .get(getRecipeById)
  .put(protect, upload.single("image"), updateRecipe)
  .delete(protect, deleteRecipe);

// POST /api/recipes/:id/reviews — Add a review to a recipe
router.post("/:id/reviews", protect, addReview);

// POST /api/recipes/:id/save — Toggle save/unsave a recipe
router.post("/:id/save", protect, toggleSaveRecipe);

module.exports = router;
