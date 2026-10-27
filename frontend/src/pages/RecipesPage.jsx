import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import RecipeCard from "../components/RecipeCard";
import "./RecipesPage.css";

const CUISINES = [
  "Indian",
  "Italian",
  "Chinese",
  "Mexican",
  "American",
  "Other",
];

const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const cuisine = searchParams.get("cuisine") || "";
  const mealType = searchParams.get("mealType") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchRecipes = async () => {
        setLoading(true);

        try {
          const params = new URLSearchParams();

          if (search.trim()) {
            params.set("search", search.trim());
          }

          if (cuisine) {
            params.set("cuisine", cuisine);
          }

          if (mealType) {
            params.set("mealType", mealType);
          }

          if (difficulty) {
            params.set("difficulty", difficulty);
          }

          params.set("page", page);
          params.set("limit", 9);

          const { data } = await api.get(
            `/recipes?${params.toString()}`
          );

          setRecipes(data.data || []);
          setTotalRecipes(data.total || 0);
          setTotalPages(data.pages || 1);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
          setRecipes([]);
          setTotalRecipes(0);
          setTotalPages(1);
        } finally {
          setLoading(false);
        }
      };

      fetchRecipes();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, cuisine, mealType, difficulty, page]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    if (key !== "page") {
      newParams.set("page", "1");
    }

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const getResultsTitle = () => {
    if (search) {
      return `Results for "${search}"`;
    }

    if (mealType) {
      return `${mealType} Recipes`;
    }

    if (cuisine) {
      return `${cuisine} Recipes`;
    }

    if (difficulty) {
      return `${difficulty} Recipes`;
    }

    return "All Recipes";
  };

  return (
    <div className="recipes-page">

      {/* Hero */}
      <section className="recipes-hero">

        <div className="recipes-hero-image">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85"
            alt="Freshly prepared food"
          />
        </div>

        <div className="recipes-hero-content">
          <span className="section-label">
            DISCOVER SOMETHING DELICIOUS
          </span>

          <h1>
            Explore Our <span>Recipes</span>
          </h1>

          <p>
            Browse delicious recipes for every craving, occasion and
            cooking level.
          </p>

          <div className="hero-quote">
            “Good food brings people together.”
          </div>
        </div>

      </section>

      {/* Search + Filters */}
      <section className="recipe-filters">

        <div className="recipe-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) =>
              updateFilter("search", e.target.value)
            }
          />

          {search && (
            <button
              className="search-clear"
              onClick={() => updateFilter("search", "")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-row">

          <select
            value={cuisine}
            onChange={(e) =>
              updateFilter("cuisine", e.target.value)
            }
          >
            <option value="">All Cuisines</option>

            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={mealType}
            onChange={(e) =>
              updateFilter("mealType", e.target.value)
            }
          >
            <option value="">All Meal Types</option>

            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) =>
              updateFilter("difficulty", e.target.value)
            }
          >
            <option value="">All Difficulties</option>

            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {(search || cuisine || mealType || difficulty) && (
            <button
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

        </div>
      </section>

      {/* Results */}
      <section className="recipes-results">

        <div className="results-heading">

          <div>
            <span className="section-label">
              OUR COLLECTION
            </span>

            <h2>{getResultsTitle()}</h2>
          </div>

          {!loading && (
            <span className="recipe-count">
              {totalRecipes}{" "}
              {totalRecipes === 1 ? "recipe" : "recipes"}
            </span>
          )}

        </div>

        {loading ? (
          <div className="recipes-loading">
            <div className="loading-spinner"></div>
            <p>Finding delicious recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="no-recipes">

            <div className="no-recipes-icon">
              🍽️
            </div>

            <h3>No recipes found</h3>

            <p>
              Try changing your search or selecting different
              filters.
            </p>

            <button
              className="clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="recipe-grid">

            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
              />
            ))}

          </div>
        )}

      </section>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="pagination">

          <button
            onClick={() =>
              updateFilter("page", page - 1)
            }
            disabled={page === 1}
          >
            ← Previous
          </button>

          <span>
            Page <strong>{page}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() =>
              updateFilter("page", page + 1)
            }
            disabled={page === totalPages}
          >
            Next →
          </button>

        </div>
      )}

    </div>
  );
};

export default RecipesPage;