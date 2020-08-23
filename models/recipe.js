const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const knex = require('knex')(configuration);

const {
  addRecipe: addRecipeQuery,
  editRecipe: editRecipeQuery,
  getAllRecipes: getAllRecipesQuery,
  getFullRecipe,
  searchRecipesMatchAll,
  searchRecipesMatchAny,
  getRecipesByIds,
} = require('../queries/recipe.js');
const { fetchQuery } = require('../queries/helpers.js');

// Gets all recipes from the database
// Returns all data from @recipes plus an array of tags (no ingredients or steps)
// TODO: Add query parameter for limit+offset
const getAllRecipes = async (request, response) => {
  const result = await getAllRecipesQuery();
  const status = result.error ? 400 : 200;
  return response.status(status).json(result);
};

// Gets all data for the recipe with @id from request.params
const getRecipe = async (request, response) => {
  const id = parseInt(request.params.id);
  const result = await getFullRecipe(id);
  return response.status(result.status).json(result.data || { error: result.error });
}

// Returns the list of recipes that match the provided search params, ordered by title
// @params.all: boolean -> Whether recipes need to match ALL or ANY of the search terms
// @params.wildcard -> Search title, ingredients/notes, step, tags and footnotes for the term
// @params.limit -> Optionally limit to that number
// @params[column_name] -> Searches the given column for matches
//    Supports: title, source, submitted_by, category, vegetarian
//              step, footnote, tags, ingredients
//    tags and ingredients can be a csv, searched separately, rest are literal
const searchRecipes = async (request, response) => {
  const all = Boolean(request.query.all);

  const { data, error } = all ? await searchRecipesMatchAll(request.query) : await searchRecipesMatchAny(request.query);

  if (error) return response.status(400).json({ error });

  const ids = data.map(el => el.recipe_id);

  const recipes = ids.length ? await getRecipesByIds(ids) : { data: [] };
  const status = recipes.error ? 400 : 200;
  return response.status(status).json(recipes);
}

// Adds a new recipe based on the data sent in request.body
// Returns @id and @title of the new recipe on success
// Returns @error with @message and optional @detalils keys on error
const addRecipe = async (request, response) => {
  const userReq = request.body;

  if (!userReq.title) {
    return response.status(400).json({ error: { message: "'title' is required" } });
  }

  if (!userReq.submitted_by) {
    return response.status(400).json({ error: { message:"'submitted_by' is required" }});
  }

  if (!userReq.category) {
    return response.status(400).json({ error: { message:"'category' is required" }});
  }

  if (!userReq.ingredients || !userReq.ingredients.length) {
    return response.status(400).json({ error: { message:"At least one ingredient is required" }});
  }

  if (!Array.isArray(userReq.ingredients)) {
    return response.status(400).json({ error: { message:"Type Error: 'ingredients' must be an array" }});
  }

  if (!userReq.steps || !userReq.steps.length) {
    return response.status(400).json({ error: { message:"At least one step is required" }});
  }

  if (!Array.isArray(userReq.steps)) {
    return response.status(400).json({ error: { message:"Type Error: 'steps' must be an array" }});
  }

  if (userReq.tags && !Array.isArray(userReq.tags)) {
    return response.status(400).json({ error: { message:"Type Error: 'tags' must be an array" }});
  }

  if (userReq.tags && userReq.tags.some(el => typeof el !== "string")) {
    return response.status(400).json({ error: { message:"Type Error: All 'tags' must be of type string" }});
  }

  if (userReq.footnotes && !Array.isArray(userReq.footnotes)) {
    return response.status(400).json({ error: { message:"Type Error: 'footnotes' must be an array" }});
  }

  const result = await addRecipeQuery(userReq);
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

// Edit the recipe whose id is in request.params based on the data sent in request.body
// Returns @id and @title of the new recipe on success
// Returns @error with @message and optional @detalils keys on error
const editRecipe = async (request, response) => {
  const id = parseInt(request.params.id);
  const userReq = request.body;

  if (!Object.keys(userReq).length) {
     return response.status(400).json({ error: { message:"You must include data to update in the request body." }});
  }

  if (userReq.tags && !Array.isArray(userReq.tags)) {
    return response.status(400).json({ error: { message:"Type Error: 'tags' must be an array" }});
  }

  if (userReq.tags && userReq.tags.some(el => typeof el !== "string")) {
    return response.status(400).json({ error: { message:"Type Error: All 'tags' must be of type string" }});
  }

  if (userReq.ingredients && !Array.isArray(userReq.ingredients)) {
    return response.status(400).json({ error: { message:"Type Error: 'ingredients' must be an array" }});
  }

  if (userReq.steps && !Array.isArray(userReq.steps)) {
    return response.status(400).json({ error: { message:"Type Error: 'steps' must be an array" }});
  }

  const result = await editRecipeQuery(id, userReq);
  if (result.error) {
    return response.status(result.error.status || 400).json({
      error: {
        message: result.error.message,
        details: result.error.details
      }
    });
  }
  return response.status(200).json({ id: result.recipe_id, title: userReq.title });
};

const listCategories = async (request, response) => {
  const result = await fetchQuery(() => knex.raw('SELECT unnest(enum_range(NULL::category))'));
  if (result.error) return response.status(500).json({ error: "Something went wrong."});
  const categories = result.data.rows.map(el => el.unnest);
  return response.status(200).json({ categories });
};

const listTags = async (request, response) => {
  const result = await fetchQuery(() => knex.distinct('tag').from('tags').orderBy('tag'));
  const status = result.error ? 400 : 200;
  return response.status(status).json({ tags: result.data.map(el => el.tag )});
}

const listSubmitters = async (request, response) => {
  const result = await fetchQuery(() => knex.distinct('submitted_by').from('recipes').orderBy('submitted_by'));
  const status = result.error ? 400 : 200;
  return response.status(status).json({ tags: result.data.map(el => el.submitted_by )});
}

module.exports = {
  addRecipe,
  editRecipe,
  getRecipe,
  getAllRecipes,
  searchRecipes,
  listCategories,
  listSubmitters,
  listTags,
};