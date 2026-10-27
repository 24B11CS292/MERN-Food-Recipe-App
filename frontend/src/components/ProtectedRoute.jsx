// components/ProtectedRoute.jsx
// A wrapper component that guards routes requiring login.
//
// Usage in App.jsx:
//   <Route path="/add-recipe" element={<ProtectedRoute><AddRecipe /></ProtectedRoute>} />
//
// If the user is not logged in, they get redirected to /login.
// The `replace` prop prevents them from going "back" to the protected page.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in — render the actual page
  return children;
};

export default ProtectedRoute;
