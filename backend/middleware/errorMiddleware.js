// middleware/errorMiddleware.js
// Centralized error handling for the entire Express app.
//
// Instead of writing try/catch in every route, we use express-async-handler
// which catches errors and passes them here automatically.
// This one place handles ALL errors consistently.

const errorHandler = (err, req, res, next) => {
  // Sometimes Express sets a 200 status even when there's an error.
  // We default to 500 (Internal Server Error) in that case.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only show the full error stack trace during development, not in production.
    // Stack traces reveal internal code structure — a security risk in production.
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

// Handles requests to routes that don't exist
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass to errorHandler above
};

module.exports = { errorHandler, notFound };
