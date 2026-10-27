import { Link } from "react-router-dom";
import "./RecipeCard.css";

const RecipeCard = ({ recipe }) => {
  const time = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <Link to={`/recipes/${recipe._id}`} className="recipe-card">
      <div className="recipe-image-wrapper">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="recipe-card-image"
        />

        <span className="recipe-badge">
          {recipe.cuisine || "Recipe"}
        </span>

        <button
          className="recipe-heart"
          onClick={(e) => e.preventDefault()}
          aria-label="Favorite recipe"
        >
          ♡
        </button>
      </div>

      <div className="recipe-card-body">
        <h3>{recipe.title}</h3>

        <div className="recipe-info">
          <span className="rating">
            ★ {recipe.averageRating?.toFixed(1) || "New"}
          </span>

          <span>•</span>

          <span>⏱ {time} min</span>
        </div>

        <div className="recipe-card-bottom">
          <span className="difficulty">
            {recipe.difficulty || "Easy"}
          </span>

          <span className="recipe-arrow">→</span>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;