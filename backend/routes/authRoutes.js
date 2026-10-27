// routes/authRoutes.js
// Maps URL paths to controller functions for authentication.
//
// Routes are like a "table of contents" — they don't contain logic themselves,
// they just say "when this URL is hit, call this function."

const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/register — Create a new account
router.post("/register", registerUser);

// POST /api/auth/login — Login and receive a token
router.post("/login", loginUser);

// GET /api/auth/me — Get current user's profile (protected: requires token)
router.get("/me", protect, getMe);

module.exports = router;
