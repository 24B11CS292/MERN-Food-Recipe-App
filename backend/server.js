// server.js
// Entry point of the backend application.
// Sets up Express, connects to MongoDB, registers middleware and routes.

const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Logs requests only in dev mode
}

// --- ROUTES ---
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/recipes", require("./routes/recipeRoutes"));

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Food Recipe API is running..." });
});

// --- ERROR HANDLING ---
app.use(notFound);
app.use(errorHandler);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});
