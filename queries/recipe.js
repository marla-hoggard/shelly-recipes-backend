const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const knex = require('knex')(configuration);

const {
  queryError,
  fetchQuery,
  fetchQuerySingleRow,
  insertViaTrx,
  deleteAndInsertViaTrx,
} = require('./helpers.js');

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

      const ingredients = request.ingredients.map(({ ingredient, footnote }, i) => ({
        ingredient,
        footnote,
        recipe_order: i,
        recipe_id,
      }));
      const ingredientsResult = await insertViaTrx(trx, 'ingredients', ingredients, recipe_id);
      if (ingredientsResult.error) return ingredientsResult;

      const steps = request.steps.map((step, i) => ({
        step,
        recipe_order: i,
        recipe_id,
      }));
      const stepsResult = await insertViaTrx(trx, 'steps', steps, recipe_id);
      if (stepsResult.error) return stepsResult;

      if (request.tags) {
        const tags = request.tags.map(tag => ({
          tag: tag.toLowerCase(),
          recipe_id,
        }));
        const tagsResult = await insertViaTrx(trx, 'tags', tags, recipe_id);
        if (tagsResult.error) return tagsResult;
      }

      if (request.notes) {
        const notes = request.notes.map((note, i) => ({
        note,
        recipe_order: i,
        recipe_id,
      }));
        const notesResult = await insertViaTrx(trx, 'notes', notes, recipe_id);
        if (notesResult.error) return notesResult;
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

const editRecipe = async (recipe_id, request) => {
  const recipe = Object.fromEntries(
    Object.entries(request)
      .filter(([key]) =>
        [
          "title",
          "source",
          "sourceUrl",
          "submittedBy",
          "servings",
          "category",
          "vegetarian"
        ].includes(key)
      ),
  );

  try {
    return await knex.transaction(async trx => {
      if (Object.keys(recipe).length) {
        try {
          const updateCount = await trx('recipes').where('id', recipe_id).update(recipe);

          if (!updateCount) {
            return {
              error: {
                message: "Recipe not found",
                status: 404,
              }
            };
          }
        } catch (error) {
          const response = queryError(error);
          return {
            error: {
              details: response.error.details || response.error.query,
              message: "Error updating recipes table.",
              status: 400,
            }
          };
        }
      }

      if (request.ingredients) {
        const ingredients = request.ingredients.map(({ ingredient, footnote }, i) => ({
          ingredient,
          footnote,
          recipe_order: i,
          recipe_id,
        }));
        const ingResult = await deleteAndInsertViaTrx(trx, 'ingredients', ingredients, recipe_id);
        if (ingResult.error) return ingResult;
      }

      if (request.steps) {
        const steps = request.steps.map((step, i) => ({
          step,
          recipe_order: i,
          recipe_id,
        }));

        const stepsResult = await deleteAndInsertViaTrx(trx, 'steps', steps, recipe_id);
        if (stepsResult.error) return stepsResult;
      }

      if (request.tags) {
        const tags = request.tags.map(tag => ({
          tag: tag.toLowerCase(),
          recipe_id,
        }));
        const tagsResult = await deleteAndInsertViaTrx(trx, 'tags', tags, recipe_id);
        if (tagsResult.error) return tagsResult;
      }

      if (request.notes) {
        const notes = request.notes.map((note, i) => ({
          note: note.toLowerCase(),
          recipe_order: i,
          recipe_id,
        }));
        const notesResult = await deleteAndInsertViaTrx(trx, 'notes', notes, recipe_id);
        if (notesResult.error) return notesResult;
      }
      return { recipe_id };
    });
  } catch (error) {
    const response = queryError(error);
    return {
      error: {
        details: response.error.details || response.error.query,
        message: "Something went wrong.",
        status: 400,
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
  return await fetchQuery(() => knex.select('ingredient', 'footnote').from('ingredients').where('recipe_id', id).orderBy('recipe_order'));
};

const getStepsByRecipeId = async id => {
  return await fetchQuery(() => knex.select('step').from('steps').where('recipe_id', id).orderBy('recipe_order'));
}

const getNotesByRecipeId = async id => {
  return await fetchQuery(() => knex.select('note').from('notes').where('recipe_id', id).orderBy('recipe_order'));
}

const getFullRecipe = async (id) => {
  const recipe = await getRecipeById(id);
  if (recipe.error) {
    return recipe.error === "No data found."
      ? { error: { message: "Recipe not found."}, status: 404 }
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

  const notes = await getNotesByRecipeId(id);
  if (notes.error) {
    return {
      error: {
        messsage: notes.error.details,
        hint: notes.error.hint
      },
      status: 400
    };
  }

  return {
    data: {
      ...recipe,
      tags: tags.data.map(t => t.tag),
      ingredients: ingredients.data.map(i => ({ ingredient: i.ingredient, footnote: i.footnote })),
      steps: steps.data.map(s => s.step),
      notes: notes.data.map(n => n.note)
    },
    status: 200,
  }
}

module.exports = {
  addRecipe,
  editRecipe,
  getAllRecipes,
  getFullRecipe,
};