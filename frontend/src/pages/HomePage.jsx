import api from "../utils/api";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RecipeCard from "../components/RecipeCard";
import "./HomePage.css";
const categories = [
  {
    name: "Breakfast",
    image:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Lunch",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Dinner",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=300&q=80",
  },
  {
  name: "Snacks",
  image:
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80",
},
];

const cuisines = [
  {
    name: "Italian",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Indian",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Mexican",
    image:
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Chinese",
    image:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "American",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
  },
];
const HomePage = () => {
  const { user } = useAuth();
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get(
  "/recipes?page=1&limit=6"
);

setFeaturedRecipes(data.data || []);
      } catch (error) {
        console.error("Failed to fetch featured recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/recipes");
    }
  };

  return (
    <div className="home-page">

      {/* ================= HERO ================= */}

      <section className="hero-section">
        <div className="hero-content">

          <div className="hero-small-text">
            FRESH INGREDIENTS <span>•</span> SIMPLE STEPS <span>•</span> GREAT
            TASTE
          </div>

          <h1>
            Discover Delicious
            <br />
            <span>Recipes</span> for Every Mood
          </h1>

          <p>
            From quick weeknight dinners to special occasion treats,
            find the perfect recipe for every craving.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search for recipes... (e.g. pasta, chicken, dessert)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button type="submit">
              Search <span>→</span>
            </button>
          </form>

        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1400&q=85"
            alt="Delicious pasta"
          />

          <div className="hero-note">
            Good Food
            <br />
            Happy Life
            <span>♡</span>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}

      <section className="features-section">

        <div className="feature">
          <div className="feature-icon">♨</div>
          <div>
            <strong>1000+</strong>
            <span>Tasty Recipes</span>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">♧</div>
          <div>
            <strong>Healthy</strong>
            <span>& Nutritious</span>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">♡</div>
          <div>
            <strong>Easy</strong>
            <span>to Follow</span>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">◎</div>
          <div>
            <strong>Loved by</strong>
            <span>Foodies Worldwide</span>
          </div>
        </div>

      </section>

      {/* ================= CATEGORIES ================= */}

      <section className="home-section categories-section">

        <div className="section-heading">
          <div>
            <span className="section-label">EXPLORE CATEGORIES</span>

            <h2>
              Find Your Next <span>Favorite</span>
            </h2>
          </div>

          <Link to="/recipes" className="view-all">
            View All →
          </Link>
        </div>

                {/* ROW 1 - MEAL TYPES */}
        <div className="category-list">

          <Link
            to="/recipes"
            className="category-item category-active"
          >
            <div className="category-all-icon">▦</div>
            <span>All</span>
          </Link>

          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/recipes?mealType=${category.name}`}
              className="category-item"
            >
              <img
                src={category.image}
                alt={category.name}
              />
              <span>{category.name}</span>
            </Link>
          ))}

        </div>
          <div className="category-quote">
  <span>“</span>
  Good food brings people together — discover flavors from around the world.
  <span>”</span>
</div>
        {/* ROW 2 - CUISINES */}
        <div className="category-list category-list-second">

          {cuisines.map((cuisine) => (
            <Link
              key={cuisine.name}
              to={`/recipes?cuisine=${cuisine.name}`}
              className="category-item"
            >
              <img
                src={cuisine.image}
                alt={cuisine.name}
              />
              <span>{cuisine.name}</span>
            </Link>
          ))}

        </div>

      </section>

      {/* ================= POPULAR RECIPES ================= */}

      {/* ================= RECIPE LIST ================= */}

<section className="home-section popular-section">

  <div className="section-heading">
    <div>
      <span className="section-label">OUR RECIPES</span>

      <h2>
        What’s Cooking <span>Today?</span>
      </h2>

      <p className="section-description">
        Explore delicious recipes and find something you’ll love.
      </p>
    </div>

    <Link to="/recipes" className="view-all">
      View All →
    </Link>
  </div>

  {loading ? (
    <div className="home-loading">
      <div className="loading-spinner"></div>
      <p>Loading delicious recipes...</p>
    </div>
  ) : (
    <div className="recipe-grid">
      {featuredRecipes.map((recipe) => (
        <RecipeCard
          key={recipe._id}
          recipe={recipe}
        />
      ))}
    </div>
  )}

</section>
      {/* ================= CTA ================= */}

      <section className="share-section">

        <div className="share-content">
          <span className="section-label">SHARE YOUR PASSION</span>

          <h2>
            Have a recipe
            <br />
            worth <span>sharing?</span>
          </h2>

          <p>
            Share your favorite recipe with our food-loving community
            and inspire someone to cook something delicious today.
          </p>

          <Link
  to={user ? "/add-recipe" : "/register"}
  className="share-button"
>
  Share a Recipe →
</Link>
        </div>

        <div className="share-image">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80"
            alt="Cooking food"
          />
        </div>

      </section>

    </div>
  );
};

export default HomePage;