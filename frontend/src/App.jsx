// App.jsx
// Root component — sets up routing and wraps the app with context providers.
//
// React Router v6 routing:
//   <Routes> contains all route definitions
//   <Route path="..." element={...}> maps a URL to a component
//   <ProtectedRoute> wraps routes that require login

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import AddEditRecipePage from "./pages/AddEditRecipePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    // AuthProvider wraps everything so any component can access auth state
    <AuthProvider>
      <Router>
        {/* Toaster renders toast notification pop-ups (from react-hot-toast) */}
        <Toaster position="top-right" />

        {/* Navbar is shown on every page */}
        <Navbar />

        <main>
          <Routes>
            {/* Public routes — accessible without login */}
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes — redirect to /login if not authenticated */}
            <Route
              path="/add-recipe"
              element={
                <ProtectedRoute>
                  <AddEditRecipePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-recipe/:id"
              element={
                <ProtectedRoute>
                  <AddEditRecipePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: redirect unknown URLs to home */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
