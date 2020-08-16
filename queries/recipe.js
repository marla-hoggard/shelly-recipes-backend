const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const knex = require('knex')(configuration);

const { queryError, fetchQuery, fetchQuerySingleRow } = require('./helpers.js');

const addRecipe = async (request) => {
  const recipe = {
    title: request.title,
    source: request.source || null,
    sourceUrl: request.sourceUrl || null,
    submittedBy: request.submittedBy,
    servings: request.servings || null,
    category: request.category,
    vegetarian: request.vegetarian || false,
    createdAt: new Date(),
  };

  let recipe_id;
  try {
    return await knex.transaction(async trx => {
      try {
        const ids = await trx('recipes').insert(recipe, 'id');
        if (!ids || !ids.length) {
          trx.rollback;
          return {
            error: {
              message: "No recipe id returned.",
            }
          };
        }
        recipe_id = ids[0];
      } catch (error) {
        const response = queryError(error);
        return {
          error: {
            details: response.error.details || response.error.query,
            message: "Error adding recipe to recipes table."
          }
        };
      }

      // TODO: Add footnotes
      const ingredients = request.ingredients.map((ingredient, i) => ({
        ingredient,
        recipe_order: i,
        recipe_id,
      }));

      try {
        const ingInserted = await trx('ingredients').insert(ingredients);
        console.log(`${ingInserted.rowCount} ingredients added for ${recipe_id}.`);
      } catch (error) {
        const response = queryError(error);
        return {
          error: {
            details: response.error.details || response.error.query,
            message: "Error adding ingredients."
          }
        };
      }

      // TODO: Add footnotes
      const steps = request.steps.map((step, i) => ({
        step,
        recipe_order: i,
        recipe_id,
      }));
      try {
        const stepsInserted = await trx('steps').insert(steps);
        console.log(`${stepsInserted.rowCount} steps added for ${recipe_id}.`);
      } catch (error) {
        const response = queryError(error);
        return {
          error: {
            details: response.error.details || response.error.query,
            message: "Error adding steps."
          }
        };
      }

      if (request.tags) {
        try {
          const tags = request.tags.map(tag => ({
            tag: tag.toLowerCase(),
            recipe_id,
          }));
          const tagsInserted = await trx('tags').insert(tags);
          console.log(`${tagsInserted.rowCount} tags added for ${recipe_id}.`);
        } catch (error) {
          const response = queryError(error);
          return {
            error: {
              details: response.error.details || response.error.query,
              message: "Error adding tags."
            }
          };
        }
      }
      return { recipe_id };
    });
  } catch (error) {
    const response = queryError(error);
    return {
      error: {
        details: response.error.details || response.error.query,
        message: "Something went wrong."
      }
    };
  }
};

const getAllRecipes = async () => {
  const query = () =>
    knex('recipes')
    .innerJoin("tags", "recipes.id", "tags.recipe_id")
    .select('recipes.*', knex.raw('array_agg(tags.tag) as tags'))
    .groupBy('recipes.id')
    .orderBy("recipes.title");

  return await fetchQuery(query);
};

const getRecipeById = async id => {
  return await fetchQuerySingleRow(() => knex.select('*').from('recipes').where('id', id));
};

const getTagsByRecipeId = async id => {
  return await fetchQuery(() => knex.select('tag').from('tags').where('recipe_id', id));
};

const getIngredientsByRecipeId = async id => {
  return await fetchQuery(() => knex.select('ingredient').from('ingredients').where('recipe_id', id).orderBy('recipe_order'));
};

const getStepsByRecipeId = async id => {
  return await fetchQuery(() => knex.select('step').from('steps').where('recipe_id', id).orderBy('recipe_order'));
}

const getFullRecipe = async (id) => {
  const recipe = await getRecipeById(id);
  if (recipe.error) {
    return recipe.error === "No data found."
      ? { error: "Recipe not found.", status: 404 }
      : { error: { messsage: recipe.error.details, hint: recipe.error.hint }, status: 400 };
  }

  const tags = await getTagsByRecipeId(id);
  if (tags.error) {
    return {
      error: {
        messsage: tags.error.details,
        hint: tags.error.hint
      },
      status: 400
    };
  }

  const ingredients = await getIngredientsByRecipeId(id);
  if (ingredients.error) {
    return {
      error: {
        messsage: ingredients.error.details,
        hint: ingredients.error.hint
      },
      status: 400
    };
  }

  const steps = await getStepsByRecipeId(id);
  if (steps.error) {
    return {
      error: {
        messsage: steps.error.details,
        hint: steps.error.hint
      },
      status: 400
    };
  }

  return {
    data: {
      ...recipe,
      tags: tags.data.map(t => t.tag),
      ingredients: ingredients.data.map(i => i.ingredient),
      steps: steps.data.map(s => s.step)
    },
    status: 200,
  }
}

module.exports = {
  addRecipe,
  getAllRecipes,
  getFullRecipe,
};