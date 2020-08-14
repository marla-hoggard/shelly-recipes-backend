const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const knex = require('knex')(configuration);

const { queryError } = require('./helpers.js');

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
  let result;
  try {
    result = await knex.transaction(async trx => {
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
  return result;
};

module.exports = {
  addRecipe,
};