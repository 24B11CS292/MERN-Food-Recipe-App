// config/db.js
// Handles connecting to MongoDB using Mongoose

const mongoose = require("mongoose");

// This function connects to MongoDB.
// We call it once when the server starts (in server.js).
const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise, so we await it.
    // process.env.MONGO_URI reads the value from our .env file.
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, print the error and stop the process.
    // Exit code 1 means "exited with an error".
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
