import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./RecipeDetailPage.css";

const RecipeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const { data } = await api.get(`/api/recipes/${id}`);
        setRecipe(data.data);

        if (user) {
          const profileRes = await api.get("/api/auth/me");

          const savedIds = profileRes.data.data.savedRecipes.map((r) =>
            typeof r === "object" ? r._id : r
          );

          setSaved(savedIds.includes(id));
        }
      } catch (error) {
        toast.error("Recipe not found");
        navigate("/recipes");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to save recipes");
      navigate("/login");
      return;
    }

    try {
      const { data } = await api.post(`/api/recipes/${id}/save`);

      setSaved(data.saved);
      toast.success(data.message);
    } catch (error) {
      toast.error("Failed to save recipe");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    try {
      await api.delete(`/api/recipes/${id}`);

      toast.success("Recipe deleted");
      navigate("/recipes");
    } catch (error) {
      toast.error("Failed to delete recipe");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to leave a review");
      return;
    }

    setSubmittingReview(true);

    try {
      await api.post(`/api/recipes/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });

      toast.success("Review submitted!");

      const { data } = await api.get(`/api/recipes/${id}`);
      setRecipe(data.data);

      setReviewComment("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit review"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your recipe...</p>
      </div>
    );
  }

  if (!recipe) return null;

  const isAuthor = user && recipe.author._id === user._id;

  const totalTime =
    recipe.totalTime ||
    (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div className="recipe-detail-page">

      {/* Hero */}
      <section className="detail-hero">

        <div className="detail-image-wrapper">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="detail-image"
          />

          <div className="detail-image-badge">
            {recipe.cuisine}
          </div>
        </div>

        <div className="detail-info">

          <div className="detail-tags">
            <span>{recipe.mealType}</span>
            <span>{recipe.difficulty}</span>
          </div>

          <h1>{recipe.title}</h1>

          <p className="detail-description">
            {recipe.description}
          </p>

          <div className="detail-rating">
            <span>★</span>

            <strong>
              {recipe.averageRating?.toFixed(1) || "New"}
            </strong>

            <span className="rating-text">
              ({recipe.numReviews || 0} reviews)
            </span>
          </div>

          <div className="detail-stats">

            <div>
              <span className="stat-icon">◷</span>
              <small>Prep</small>
              <strong>{recipe.prepTime} min</strong>
            </div>

            <div>
              <span className="stat-icon">♨</span>
              <small>Cook</small>
              <strong>{recipe.cookTime} min</strong>
            </div>

            <div>
              <span className="stat-icon">◷</span>
              <small>Total</small>
              <strong>{totalTime} min</strong>
            </div>

            <div>
              <span className="stat-icon">♧</span>
              <small>Serves</small>
              <strong>{recipe.servings}</strong>
            </div>

          </div>

          <div className="detail-author">
            Recipe by <strong>{recipe.author.name}</strong>
          </div>

          <div className="detail-actions">

            <button
              onClick={handleSave}
              className={`save-recipe-btn ${saved ? "saved" : ""}`}
            >
              {saved ? "♥ Saved" : "♡ Save Recipe"}
            </button>

            {isAuthor && (
              <>
                <Link
                  to={`/edit-recipe/${id}`}
                  className="edit-recipe-btn"
                >
                  Edit
                </Link>

                <button
                  onClick={handleDelete}
                  className="delete-recipe-btn"
                >
                  Delete
                </button>
              </>
            )}

          </div>

        </div>
      </section>

      {/* Main content */}
      <div className="detail-content">

        {/* Ingredients */}
        <section className="detail-section ingredients-section">

          <div className="detail-section-heading">
            <span className="section-label">WHAT YOU NEED</span>
            <h2>Ingredients</h2>
          </div>

          <div className="ingredients-list">

            {recipe.ingredients.map((ing, index) => (
              <div
                key={index}
                className="ingredient-item"
              >
                <span className="ingredient-dot"></span>

                <span className="ingredient-name">
                  {ing.name}
                </span>

                <span className="ingredient-amount">
                  {ing.amount}
                </span>
              </div>
            ))}

          </div>
        </section>

        {/* Instructions */}
        <section className="detail-section instructions-section">

          <div className="detail-section-heading">
            <span className="section-label">LET'S GET COOKING</span>
            <h2>Instructions</h2>
          </div>

          <div className="instructions-list">

            {recipe.instructions.map((step, index) => (
              <div
                key={index}
                className="instruction-item"
              >
                <div className="step-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="step-content">
                  <h3>Step {index + 1}</h3>
                  <p>{step}</p>
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* Reviews */}
        <section className="detail-section reviews-section">

          <div className="detail-section-heading">
            <span className="section-label">WHAT PEOPLE SAY</span>

            <h2>
              Reviews
              <span className="review-count">
                ({recipe.numReviews || 0})
              </span>
            </h2>
          </div>

          {/* Review form */}
          {user ? (
            <form
              onSubmit={handleReviewSubmit}
              className="review-form"
            >
              <h3>Share your experience</h3>

              <label>Rating</label>

              <select
                value={reviewRating}
                onChange={(e) =>
                  setReviewRating(Number(e.target.value))
                }
                className="review-select"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)} {n} Star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="What did you think about this recipe?"
                value={reviewComment}
                onChange={(e) =>
                  setReviewComment(e.target.value)
                }
                required
                className="review-textarea"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="submit-review-btn"
              >
                {submittingReview
                  ? "Submitting..."
                  : "Submit Review →"}
              </button>
            </form>
          ) : (
            <div className="login-review">
              <p>
                Want to share your thoughts?
              </p>

              <Link to="/login">
                Login to leave a review →
              </Link>
            </div>
          )}

          {/* Existing reviews */}
          <div className="reviews-list">

            {recipe.reviews.length === 0 ? (
              <div className="no-reviews">
                <span>♡</span>
                <p>No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              recipe.reviews.map((review) => (
                <div
                  key={review._id}
                  className="review-card"
                >
                  <div className="review-top">

                    <div className="review-user">
                      <div className="review-avatar">
                        {review.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{review.name}</strong>

                        <small>
                          {new Date(
                            review.createdAt
                          ).toLocaleDateString()}
                        </small>
                      </div>
                    </div>

                    <span className="review-stars">
                      {"★".repeat(review.rating)}
                    </span>

                  </div>

                  <p>{review.comment}</p>
                </div>
              ))
            )}

          </div>
        </section>

      </div>
    </div>
  );
};

export default RecipeDetailPage;