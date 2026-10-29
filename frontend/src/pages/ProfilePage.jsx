import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import RecipeCard from "../components/RecipeCard";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user } = useAuth();

  const [myRecipes, setMyRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [myRecipeCount, setMyRecipeCount] = useState(0);
  const [activeTab, setActiveTab] = useState("my");
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);

      const recipesRes = await api.get(
        `/api/recipes?author=${user._id}&limit=50`
      );

      const profileRes = await api.get("/api/auth/me");

      setMyRecipes(recipesRes.data.data || []);
      setMyRecipeCount(recipesRes.data.total || 0);

      setSavedRecipes(
        (profileRes.data.data.savedRecipes || []).filter(Boolean)
      );
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleSaveChange = (recipe, saved) => {
    if (saved) {
      setSavedRecipes((prev) => {
        const exists = prev.some(
          (item) => item._id === recipe._id
        );

        if (exists) {
          return prev;
        }

        return [...prev, recipe];
      });
    } else {
      setSavedRecipes((prev) =>
        prev.filter((item) => item._id !== recipe._id)
      );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">

      {/* Profile Header */}
      <section className="profile-hero">

        <div className="profile-user">

          <div className="profile-avatar-wrapper">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <span className="profile-label">
              MY PROFILE
            </span>

            <h1>{user.name}</h1>

            <p>{user.email}</p>

            <span className="profile-member">
              RecipeHub member
            </span>
          </div>

        </div>

        {/* Profile Stats */}
        <div className="profile-stats">

          <div className="profile-stat">
            <span className="profile-stat-icon">
              🍳
            </span>

            <div>
              <strong>{myRecipeCount}</strong>
              <span>Recipes Added</span>
            </div>
          </div>

          <div className="profile-stat">
            <span className="profile-stat-icon heart-icon">
              ♥
            </span>

            <div>
              <strong>{savedRecipes.length}</strong>
              <span>Wishlist</span>
            </div>
          </div>

        </div>

      </section>

      {/* Tabs */}
      <section className="profile-content">

        <div className="profile-tabs">

          <button
            className={
              activeTab === "my"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() => setActiveTab("my")}
          >
            <span>🍳</span>
            My Recipes
            <b>{myRecipeCount}</b>
          </button>

          <button
            className={
              activeTab === "saved"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() => setActiveTab("saved")}
          >
            <span>♥</span>
            Wishlist
            <b>{savedRecipes.length}</b>
          </button>

        </div>

        {/* Loading */}
        {loading ? (
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading your recipes...</p>
          </div>
        ) : activeTab === "my" ? (

          /* My Recipes */
          <section>

            <div className="profile-section-heading">

              <div>
                <span className="section-label">
                  YOUR CREATIONS
                </span>

                <h2>
                  My Recipes
                  <span> ({myRecipeCount})</span>
                </h2>
              </div>

              <Link
                to="/add-recipe"
                className="add-recipe-button"
              >
                + Add Recipe
              </Link>

            </div>

            {myRecipes.length === 0 ? (
              <div className="profile-empty">

                <div className="empty-icon">
                  🍳
                </div>

                <h3>No recipes yet</h3>

                <p>
                  You haven't added any recipes.
                  Start sharing your favorite dish!
                </p>

                <Link
                  to="/add-recipe"
                  className="empty-button"
                >
                  Add Your First Recipe →
                </Link>

              </div>
            ) : (
              <div className="profile-recipe-grid">

                {myRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe._id}
                    recipe={recipe}
                    onSaveChange={handleSaveChange}
                  />
                ))}

              </div>
            )}

          </section>

        ) : (

          /* Wishlist */
          <section>

            <div className="profile-section-heading">

              <div>
                <span className="section-label">
                  YOUR FAVORITES
                </span>

                <h2>
                  My Wishlist
                  <span> ({savedRecipes.length})</span>
                </h2>
              </div>

              <Link
                to="/recipes"
                className="browse-button"
              >
                Browse Recipes →
              </Link>

            </div>

            {savedRecipes.length === 0 ? (
              <div className="profile-empty">

                <div className="empty-icon heart-empty">
                  ♡
                </div>

                <h3>Your wishlist is empty</h3>

                <p>
                  Save recipes you love and they'll appear
                  here for you to find later.
                </p>

                <Link
                  to="/recipes"
                  className="empty-button"
                >
                  Explore Recipes →
                </Link>

              </div>
            ) : (
              <div className="profile-recipe-grid">

                {savedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe._id}
                    recipe={recipe}
                    onSaveChange={handleSaveChange}
                  />
                ))}

              </div>
            )}

          </section>
        )}

      </section>

    </div>
  );
};

export default ProfilePage;