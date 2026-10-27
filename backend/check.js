const fs = require("fs");
const csv = require("csv-parser");

fs.createReadStream("./dataset/recipes.csv")
  .pipe(csv())
  .on("data", (row) => {
    console.log("Recipe Name:", row.Name);
    console.log("Images:", row.Images);
    console.log("Category:", row.RecipeCategory);
    console.log("Ingredients:", row.RecipeIngredientParts);
    console.log("Quantities:", row.RecipeIngredientQuantities);
    console.log("Instructions:", row.RecipeInstructions);
    console.log("Prep Time:", row.PrepTime);
    console.log("Cook Time:", row.CookTime);
    console.log("Servings:", row.RecipeServings);

    process.exit();
  })
  .on("error", (err) => {
    console.log("Error:", err.message);
  });