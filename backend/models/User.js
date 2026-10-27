// models/User.js
// Defines what a "User" document looks like in MongoDB.
// Mongoose uses this schema to validate and structure data before saving.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // Removes extra spaces from both ends
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // No two users can have the same email
      lowercase: true, // Stores email in lowercase for consistent comparison
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // By default, password is NOT returned in queries (security)
    },

    profilePicture: {
      type: String,
      default: "https://www.gravatar.com/avatar/?d=mp", // Default avatar if none uploaded
    },

    // Array of Recipe IDs that this user has saved/bookmarked
    savedRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe", // "ref" tells Mongoose this links to the Recipe model
      },
    ],
  },
  {
    // Automatically adds "createdAt" and "updatedAt" fields
    timestamps: true,
  }
);

// --- MIDDLEWARE (Hooks) ---
// This runs automatically BEFORE a user document is saved.
// We hash the password here so we never store plain-text passwords.
userSchema.pre("save", async function (next) {
  // Only hash if the password field was actually changed.
  // Prevents re-hashing an already hashed password on profile updates.
  if (!this.isModified("password")) return next();

  // bcrypt.genSalt(10) generates a "salt" — random data added to the password
  // before hashing. The number 10 is the "cost factor" (higher = slower = more secure).
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next(); // Continue saving the document
});

// --- INSTANCE METHODS ---
// Custom method we add to every User document.
// Used in the login controller to check if entered password matches stored hash.
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare() hashes the entered password with the same salt and compares.
  // Returns true if they match, false otherwise.
  return await bcrypt.compare(enteredPassword, this.password);
};

// mongoose.model() compiles the schema into a Model.
// "User" becomes the collection name "users" in MongoDB automatically.
module.exports = mongoose.model("User", userSchema);
