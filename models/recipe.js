const {
  addRecipe: addRecipeQuery
} = require('../queries/recipe.js');

const addRecipe = async (request, response) => {
  const userReq = request.body;

  if (!userReq.title) {
    return response.status(400).json({ error: "'title' is required" });
  }

  if (!userReq.submittedBy) {
    return response.status(400).json({ error: "'submittedBy' is required" });
  }

  if (!userReq.category) {
    return response.status(400).json({ error: "'category' is required" });
  }

  if (!userReq.ingredients || !userReq.ingredients.length) {
    return response.status(400).json({ error: "At least one ingredient is required" });
  }

  if (!Array.isArray(userReq.ingredients)) {
    return response.status(400).json({ error: "Type Error: 'ingredients' must be an array" });
  }

  if (!userReq.steps || !userReq.steps.length) {
    return response.status(400).json({ error: "At least one step is required" });
  }

  if (!Array.isArray(userReq.steps)) {
    return response.status(400).json({ error: "Type Error: 'steps' must be an array" });
  }

  if (userReq.tags && !Array.isArray(userReq.tags)) {
    return response.status(400).json({ error: "Type Error: 'tags' must be an array" });
  }

  const result = await addRecipeQuery(userReq);
  console.log(result);
  if (result.error) {
    return response.status(400).json({
      error: {
        message: result.error.message,
        details: result.error.details
      }
    });
  }
  return response.status(200).json({ id: result.recipe_id, title: userReq.title });
};

module.exports = {
  addRecipe,
};