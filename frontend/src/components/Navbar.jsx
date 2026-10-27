import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">

      <Link to="/" className="navbar-brand">
        <span className="brand-leaf">⌁</span>
        <span>
          Recipe<span>Hub</span>
        </span>
      </Link>

      <nav className="navbar-links">

        <Link
          to="/"
          className={location.pathname === "/" ? "nav-link active" : "nav-link"}
        >
          Home
        </Link>

        <Link
          to="/recipes"
          className={
            location.pathname === "/recipes"
              ? "nav-link active"
              : "nav-link"
          }
        >
          Recipes
        </Link>

        {user && (
          <Link
            to="/add-recipe"
            className="nav-link"
          >
            Add Recipe
          </Link>
        )}

        <span className="nav-divider"></span>

        {user ? (
          <>
            <Link to="/profile" className="profile-link">
              {user.name}
            </Link>

            <button
              onClick={handleLogout}
              className="login-button"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-button">
              Login
            </Link>

            <Link to="/register" className="register-button">
              Register
            </Link>
          </>
        )}

      </nav>

    </header>
  );
};

export default Navbar;