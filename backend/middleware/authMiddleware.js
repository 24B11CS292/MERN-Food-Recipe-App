// middleware/authMiddleware.js
// Protects routes that require the user to be logged in.
//
// How JWT auth works:
// 1. User logs in → server gives them a "token" (a long encoded string)
// 2. User stores this token in localStorage on the browser
// 3. On every protected request, the browser sends the token in the Authorization header
// 4. This middleware checks that token — if valid, allows the request through

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Tokens are sent in the "Authorization" header with format: "Bearer <token>"
  // We check if the header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract the actual token by removing the "Bearer " prefix
      token = req.headers.authorization.split(" ")[1];

      // jwt.verify() decodes the token using our secret key.
      // If the token is expired or tampered with, it throws an error.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user's data to the request object.
      // Now any route handler that comes after this middleware can access req.user.
      // We use .select("-password") to exclude the password field.
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }

      next(); // User is authenticated — move on to the actual route handler
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

module.exports = { protect };
