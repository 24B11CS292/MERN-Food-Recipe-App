# Food Recipe App — MERN Stack

A full-stack recipe sharing platform built with MongoDB, Express, React, and Node.js.

## Features
- User registration and login with JWT authentication
- Create, edit, delete recipes with image upload (Cloudinary)
- Search recipes by keyword, filter by cuisine / meal type / difficulty
- Save/bookmark recipes to your profile
- Leave star ratings and comments
- Pagination on recipe listing

---

## Project Structure

```
food-recipe-app/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── cloudinary.js      # Image upload setup
│   ├── controllers/
│   │   ├── authController.js  # Register, login, get profile
│   │   └── recipeController.js# CRUD, reviews, save/unsave
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT token verification
│   │   └── errorMiddleware.js # Centralized error handling
│   ├── models/
│   │   ├── User.js            # User schema (with password hashing)
│   │   └── Recipe.js          # Recipe schema (with reviews sub-doc)
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   └── recipeRoutes.js    # /api/recipes/*
│   └── server.js              # Entry point
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx    # Global auth state (login/logout/register)
        ├── components/
        │   ├── Navbar.jsx         # Top navigation bar
        │   ├── RecipeCard.jsx     # Recipe summary card
        │   └── ProtectedRoute.jsx # Redirects unauthenticated users
        ├── pages/
        │   ├── HomePage.jsx       # Landing page with featured recipes
        │   ├── RecipesPage.jsx    # All recipes with search + filters
        │   ├── RecipeDetailPage.jsx # Full recipe view + reviews
        │   ├── AddEditRecipePage.jsx # Create or edit a recipe
        │   ├── LoginPage.jsx      # Login form
        │   ├── RegisterPage.jsx   # Register form
        │   └── ProfilePage.jsx    # User's recipes + saved recipes
        ├── utils/
        │   └── api.js             # Axios instance with auth headers
        └── App.jsx                # Routes setup
```

---

## Setup & Run

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (free tier is fine)
- Cloudinary account (free tier)

### Backend

```bash
cd backend
npm install

# Copy and fill in your credentials
cp .env.example .env

npm run dev   # Starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env  # Already set to localhost:5000 by default

npm run dev   # Starts on http://localhost:5173
```

---

## API Reference

### Auth
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| POST | /api/auth/register | Create account | No |
| POST | /api/auth/login | Login, get token | No |
| GET | /api/auth/me | Get my profile | Yes |

### Recipes
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | /api/recipes | Get all (with filters) | No |
| GET | /api/recipes/:id | Get one recipe | No |
| POST | /api/recipes | Create recipe | Yes |
| PUT | /api/recipes/:id | Update recipe | Yes (author) |
| DELETE | /api/recipes/:id | Delete recipe | Yes (author) |
| POST | /api/recipes/:id/reviews | Add review | Yes |
| POST | /api/recipes/:id/save | Toggle save | Yes |

### Query Parameters for GET /api/recipes
- `search` — keyword search in title/description
- `cuisine` — Indian, Italian, Chinese, Mexican, American, Other
- `mealType` — Breakfast, Lunch, Dinner, Snack, Dessert
- `difficulty` — Easy, Medium, Hard
- `page` — page number (default: 1)
- `limit` — results per page (default: 9)

---

## Key Concepts Explained

**JWT Authentication:** When a user logs in, the server creates a signed token containing their user ID. This token is stored in `localStorage` and sent with every request in the `Authorization: Bearer <token>` header. The `protect` middleware verifies the token before allowing access to protected routes.

**Password Hashing:** Passwords are never stored as plain text. `bcryptjs` hashes the password with a random "salt" before saving. On login, `bcrypt.compare()` checks if the entered password matches the stored hash.

**Mongoose Middleware:** The `pre('save')` hook in `User.js` automatically hashes the password every time a user document is saved with a modified password.

**Context API:** Instead of passing `user` data through every component as props ("prop drilling"), `AuthContext` makes it available to any component via the `useAuth()` hook.

**Cloudinary + Multer:** File uploads go directly from the browser → Express (Multer parses the multipart form) → Cloudinary (stores the image) → Cloudinary URL saved in MongoDB.
