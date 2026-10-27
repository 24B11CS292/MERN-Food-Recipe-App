// pages/AddEditRecipePage.jsx
// This single page handles BOTH adding a new recipe AND editing an existing one.
// If a recipe ID exists in the URL params, it's "edit mode"; otherwise it's "add mode".

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

const CUISINES = ["Indian", "Italian", "Chinese", "Mexican", "American", "Other"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const AddEditRecipePage = () => {
  const { id } = useParams(); // If editing, id is defined; if adding, id is undefined
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Form state — all fields in one object for easy handling
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cuisine: "Indian",
    mealType: "Dinner",
    difficulty: "Easy",
    prepTime: "",
    cookTime: "",
    servings: "",
    ingredients: [{ name: "", amount: "" }], // Start with one empty ingredient row
    instructions: [""], // Start with one empty instruction step
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  // If editing, pre-fill the form with existing recipe data
  useEffect(() => {
    if (isEditMode) {
      const fetchRecipe = async () => {
        try {
          const { data } = await api.get(`/recipes/${id}`);
          const r = data.data;
          setFormData({
            title: r.title,
            description: r.description,
            cuisine: r.cuisine,
            mealType: r.mealType,
            difficulty: r.difficulty,
            prepTime: r.prepTime,
            cookTime: r.cookTime,
            servings: r.servings,
            ingredients: r.ingredients,
            instructions: r.instructions,
          });
          setImagePreview(r.image);
        } catch {
          toast.error("Failed to load recipe");
          navigate("/recipes");
        }
      };
      fetchRecipe();
    }
  }, [id]);

  // Generic handler for simple text/select/number fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // When user picks an image, show a local preview before uploading
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Creates a temporary local URL
    }
  };

  // --- Ingredient handlers ---
  const handleIngredientChange = (index, field, value) => {
    const updated = [...formData.ingredients]; // Copy array to avoid direct state mutation
    updated[index][field] = value;
    setFormData({ ...formData, ingredients: updated });
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: "", amount: "" }],
    });
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  // --- Instruction handlers ---
  const handleInstructionChange = (index, value) => {
    const updated = [...formData.instructions];
    updated[index] = value;
    setFormData({ ...formData, instructions: updated });
  };

  const addInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, ""],
    });
  };

  const removeInstruction = (index) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  // Form submission — uses FormData because we're sending a file + JSON data together
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FormData is required when uploading files via multipart/form-data
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("cuisine", formData.cuisine);
      form.append("mealType", formData.mealType);
      form.append("difficulty", formData.difficulty);
      form.append("prepTime", formData.prepTime);
      form.append("cookTime", formData.cookTime);
      form.append("servings", formData.servings);

      // Arrays/objects must be JSON stringified when sent as FormData
      form.append("ingredients", JSON.stringify(formData.ingredients));
      form.append("instructions", JSON.stringify(formData.instructions));

      if (imageFile) {
        form.append("image", imageFile);
      }

      if (isEditMode) {
        await api.put(`/recipes/${id}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Recipe updated!");
        navigate(`/recipes/${id}`);
      } else {
        const { data } = await api.post("/recipes", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Recipe created!");
        navigate(`/recipes/${data.data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{isEditMode ? "Edit Recipe" : "Add New Recipe"}</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Info */}
        <div style={styles.group}>
          <label style={styles.label}>Recipe Title *</label>
          <input name="title" value={formData.title} onChange={handleChange}
            required style={styles.input} placeholder="e.g. Butter Chicken" />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Description *</label>
          <textarea name="description" value={formData.description} onChange={handleChange}
            required style={styles.textarea} placeholder="Brief description of your recipe..." />
        </div>

        {/* Dropdowns */}
        <div style={styles.row}>
          <div style={styles.group}>
            <label style={styles.label}>Cuisine</label>
            <select name="cuisine" value={formData.cuisine} onChange={handleChange} style={styles.select}>
              {CUISINES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Meal Type</label>
            <select name="mealType" value={formData.mealType} onChange={handleChange} style={styles.select}>
              {MEAL_TYPES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Difficulty</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange} style={styles.select}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Time & Servings */}
        <div style={styles.row}>
          <div style={styles.group}>
            <label style={styles.label}>Prep Time (min) *</label>
            <input name="prepTime" type="number" value={formData.prepTime} onChange={handleChange}
              required min="0" style={styles.input} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Cook Time (min) *</label>
            <input name="cookTime" type="number" value={formData.cookTime} onChange={handleChange}
              required min="0" style={styles.input} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Servings *</label>
            <input name="servings" type="number" value={formData.servings} onChange={handleChange}
              required min="1" style={styles.input} />
          </div>
        </div>

        {/* Image Upload */}
        <div style={styles.group}>
          <label style={styles.label}>Recipe Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" style={styles.preview} />
          )}
        </div>

        {/* Ingredients */}
        <div style={styles.group}>
          <label style={styles.label}>Ingredients *</label>
          {formData.ingredients.map((ing, index) => (
            <div key={index} style={styles.ingredientRow}>
              <input
                placeholder="Amount (e.g. 2 cups)"
                value={ing.amount}
                onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                style={{ ...styles.input, width: "30%" }}
                required
              />
              <input
                placeholder="Ingredient name"
                value={ing.name}
                onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                style={{ ...styles.input, flex: 1 }}
                required
              />
              {formData.ingredients.length > 1 && (
                <button type="button" onClick={() => removeIngredient(index)} style={styles.removeBtn}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addIngredient} style={styles.addBtn}>+ Add Ingredient</button>
        </div>

        {/* Instructions */}
        <div style={styles.group}>
          <label style={styles.label}>Instructions *</label>
          {formData.instructions.map((step, index) => (
            <div key={index} style={styles.instructionRow}>
              <span style={styles.stepNumber}>{index + 1}</span>
              <textarea
                placeholder={`Step ${index + 1}...`}
                value={step}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                style={{ ...styles.textarea, flex: 1 }}
                required
              />
              {formData.instructions.length > 1 && (
                <button type="button" onClick={() => removeInstruction(index)} style={styles.removeBtn}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addInstruction} style={styles.addBtn}>+ Add Step</button>
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? "Saving..." : isEditMode ? "Update Recipe" : "Create Recipe"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: "800px", margin: "0 auto", padding: "2rem" },
  title: { fontSize: "1.8rem", marginBottom: "2rem", fontWeight: "700" },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  group: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontWeight: "600", fontSize: "0.95rem" },
  input: { padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" },
  textarea: { padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem", minHeight: "80px", resize: "vertical" },
  select: { padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" },
  preview: { width: "200px", borderRadius: "8px", marginTop: "0.5rem" },
  ingredientRow: { display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" },
  instructionRow: { display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.5rem" },
  stepNumber: { background: "#ff6b35", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0, marginTop: "6px", fontSize: "0.85rem" },
  addBtn: { background: "transparent", border: "1px dashed #ff6b35", color: "#ff6b35", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer", marginTop: "0.25rem" },
  removeBtn: { background: "#fce4ec", border: "none", color: "#c62828", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  submitBtn: { background: "#ff6b35", color: "white", border: "none", padding: "0.85rem", borderRadius: "8px", fontSize: "1rem", fontWeight: "700", cursor: "pointer" },
};

export default AddEditRecipePage;
