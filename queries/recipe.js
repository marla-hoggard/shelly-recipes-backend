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
    source_url: request.source_url || null,
    submitted_by: request.submitted_by,
    servings: request.servings || null,
    category: request.category,
    vegetarian: request.vegetarian || false,
    featured: request.featured || false,
    created_at: new Date(),
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

      const ingredients = request.ingredients.map(({ ingredient, note }, i) => ({
        ingredient,
        note,
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

      if (request.footnotes) {
        const footnotes = request.footnotes.map((footnote, i) => ({
        footnote,
        recipe_order: i,
        recipe_id,
      }));
        const footnotesResult = await insertViaTrx(trx, 'footnotes', footnotes, recipe_id);
        if (footnotesResult.error) return footnotesResult;
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
          "source_url",
          "submitted_by",
          "servings",
          "category",
          "vegetarian",
          "featured",
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
        const ingredients = request.ingredients.map(({ ingredient, note }, i) => ({
          ingredient,
          note,
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

      if (request.footnotes) {
        const footnotes = request.footnotes.map((footnote, i) => ({
          footnote: footnote,
          recipe_order: i,
          recipe_id,
        }));
        const footnotesResult = await deleteAndInsertViaTrx(trx, 'footnotes', footnotes, recipe_id);
        if (footnotesResult.error) return footnotesResult;
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
    .leftOuterJoin("tags", "recipes.id", "tags.recipe_id")
    .select('recipes.*', knex.raw('array_remove(array_agg(tags.tag), NULL) AS tags'))
    .groupBy('recipes.id')
    .orderBy("recipes.title");

  return await fetchQuery(query);
};

// Getters -> Return exact matches
const getRecipeById = async id => {
  return await fetchQuerySingleRow(() => knex.select('*').from('recipes').where('id', id));
};

const getRecipesByIds = async (ids) => {
  return await fetchQuery(() =>
    knex('recipes')
    .leftOuterJoin("tags", "recipes.id", "tags.recipe_id")
    .select('recipes.*', knex.raw('array_remove(array_agg(tags.tag), NULL) AS tags'))
    .whereIn('recipes.id', ids)
    .groupBy('recipes.id')
    .orderBy("recipes.title"),
  );
}

const getTagsByRecipeId = async id => {
  return await fetchQuery(() => knex.select('tag').from('tags').where('recipe_id', id));
};

const getIngredientsByRecipeId = async id => {
  return await fetchQuery(() => knex.select('ingredient', 'note').from('ingredients').where('recipe_id', id).orderBy('recipe_order'));
};

const getStepsByRecipeId = async id => {
  return await fetchQuery(() => knex.select('step').from('steps').where('recipe_id', id).orderBy('recipe_order'));
}

const getFootnotesByRecipeId = async id => {
  return await fetchQuery(() => knex.select('footnote').from('footnotes').where('recipe_id', id).orderBy('recipe_order'));
}

// Search -> Return list of recipe_ids based on case insensitive search queries

// Returns an array of recipe ids that match ALL search params
const searchRecipesForMatches = async (params, matchAll) => {
  const {
    title,
    source,
    submitted_by,
    category,
    vegetarian,
    featured,
    steps,
    footnotes,
    tags,
    ingredients,
    wildcard,
    limit,
  } = params;

  const queries = [];

  if (title || source || submitted_by || category || vegetarian || featured) {
    queries.push(searchRecipeData({ title, source, submitted_by, category, vegetarian, featured }, matchAll));
  }

  if (steps) {
    queries.push(searchRecipeSteps(steps, matchAll));
  }

  if (ingredients) {
    queries.push(searchRecipeIngredients(ingredients, matchAll));
  }

  if (tags) {
    queries.push(searchRecipeTags(tags, matchAll));
  }

  if (footnotes) {
    queries.push(searchRecipeFootnotes(footnotes, matchAll));
  }

  if (wildcard) {
    if (wildcard.includes(",")) {
      wildcard.split(",").forEach(el => queries.push(searchWildcard(el.trim(), matchAll)));
    } else {
      queries.push(searchWildcard(wildcard, matchAll));
    }
  }

  if (!queries.length) {
    return { error: "You must provide at least one search parameter" };
  }

  return await fetchQuery(() =>
    knex.select('id as recipe_id').from('recipes')
      .modify(qb => {
        if (matchAll) {
          queries.forEach(q => qb.whereIn('id', q));
        } else {
          queries.forEach(q => qb.orWhereIn('id', q));
        }

        if (limit) {
          qb.limit(parseInt(limit));
        }
      })
  );
}

const searchRecipeData = (params, matchAll) => {
  return matchAll ? searchRecipeDataAll(params) : searchRecipeDataAny(params);
};

// @params = { key: value } where keys in searchable columns of recipes table
// Returns a subquery for use in main search function
const searchRecipeDataAll = (params) => {
  const { title, source, submitted_by, category, vegetarian, featured } = params;
  return knex.select('id as recipe_id').from('recipes')
      .modify(queryBuilder => {
        if (title !== undefined) {
          if (title.includes(",")) {
            title.split(",").forEach(term => {
              queryBuilder.andWhere('title', '~*', term.trim());
            });
          } else {
            queryBuilder.andWhere('title', '~*', title.trim());
          }
        }
        if (source !== undefined) {
          queryBuilder.andWhere('source', '~*', source);
        }
        if (submitted_by !== undefined) {
          queryBuilder.andWhere('submitted_by', '~*', submitted_by);
        }
        if (category !== undefined) {
          queryBuilder.andWhere({ category });
        }
        if (vegetarian !== undefined) {
          queryBuilder.andWhere({ vegetarian });
        }
        if (featured !== undefined) {
          queryBuilder.andWhere({ featured });
        }
      });
}

// @params = { key: value } where keys in searchable columns of recipes table
// Returns a subquery for use in main search function
const searchRecipeDataAny = (params) => {
  const { title, source, submitted_by, category, vegetarian, featured} = params;
  return knex.select('id as recipe_id').from('recipes')
      .modify(queryBuilder => {
        if (title !== undefined) {
          queryBuilder.orWhere('title', '~*', title.replace(/\s*,\s*/g, "|"));
        }
        if (source !== undefined) {
          queryBuilder.orWhere('source', '~*', source);
        }
        if (submitted_by !== undefined) {
          queryBuilder.orWhere('submitted_by', '~*', submitted_by);
        }
        if (category !== undefined) {
          queryBuilder.orWhere({ category });
        }
        if (vegetarian !== undefined) {
          queryBuilder.orWhere({ vegetarian });
        }
        if (featured !== undefined) {
          queryBuilder.orWhere({ featured });
        }
      });
}

// Returns a subquery for use in main search function
const searchRecipeSteps = (steps, matchAll) => {
  if (matchAll && steps.includes(",")) {
    const searchTerms = steps.split(",").map(el => el.trim());
    return knex.distinct('recipe_id').from('steps')
      .where('step', '~*', searchTerms[0])
      .intersect(
        searchTerms.slice(1).map(term =>
          knex.distinct('recipe_id').from('steps').where('step', '~*', term)
        ),
        true,
      );
  }
  const searchTerm = steps.replace(/,\s*/g, "|");
  return knex.distinct('recipe_id').from('steps').where('step', '~*', searchTerm);
}


// Returns a subquery for use in main search function
const searchRecipeFootnotes = (footnotes, matchAll) => {
  if (matchAll && footnotes.includes(",")) {
    const searchTerms = footnotes.split(",").map(el => el.trim());
    return knex.distinct('recipe_id').from('footnotes')
      .where('footnote', '~*', searchTerms[0])
      .intersect(
        searchTerms.slice(1).map(term =>
          knex.distinct('recipe_id').from('footnotes').where('footnote', '~*', term)
        ),
        true,
      );
  }
  const searchTerm = footnotes.replace(/,\s*/g, "|");
  return knex.distinct('recipe_id').from('footnotes').where('footnote', '~*', searchTerm);
}

// @ingredient: string -> a single ingredient or a comma-separated string of ingredients
// Returns a subquery for use in main search function
// Query selects recipe_ids whose ingredients or notes match search terms
const searchRecipeIngredients = (ingredients, matchAll) => {
  if (matchAll && ingredients.includes(",")) {
    const searchTerms = ingredients.split(",").map(el => el.trim());
    return knex.distinct('recipe_id').from('ingredients')
      .where('ingredient', '~*', searchTerms[0]).orWhere('note', '~*', searchTerms[0])
      .intersect(
        searchTerms.slice(1).map(term =>
          knex.distinct('recipe_id').from('ingredients')
            .where('ingredient', '~*', term).orWhere('note', '~*', term)
        ),
        true,
      );
  }

  const searchTerm = ingredients.replace(/\s*,\s*/g, "|");
  return knex.distinct('recipe_id').from('ingredients')
      .where('ingredient', '~*', searchTerm)
      .orWhere('note', '~*', searchTerm)
}

// @tags: string -> a single ingredient or a comma-separated string of ingredients
// Returns a subquery for use in main search function
// Query selects recipe_ids where ingredient or note matches any of the ingredients
const searchRecipeTags = (tags, matchAll) => {
  if (matchAll && tags.includes(",")) {
    const searchTerms = tags.split(",").map(el => el.trim());
    return knex.distinct('recipe_id').from('tags')
      .where('tag', '~*', searchTerms[0])
      .intersect(
        searchTerms.slice(1).map(term =>
          knex.distinct('recipe_id').from('tags').where('tag', '~*', term)
        ),
        true,
      );
  }
  const searchTerm = tags.replace(/,\s*/g, "|");
  return knex.distinct('recipe_id').from('tags').where('tag', '~*', searchTerm);
}

// Returns a subquery for recipe ids where @searchTerm
// matches title, ingredient, step, tag or footnote
const searchWildcard = (searchTerm, matchAll) => {
  return searchRecipeDataAny({ title: searchTerm }, matchAll)
    .union(
      [
        searchRecipeIngredients(searchTerm, matchAll),
        searchRecipeSteps(searchTerm, matchAll),
        searchRecipeTags(searchTerm, matchAll),
        searchRecipeFootnotes(searchTerm, matchAll),
      ],
      true,
    );
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

  const footnotes = await getFootnotesByRecipeId(id);
  if (footnotes.error) {
    return {
      error: {
        messsage: footnotes.error.details,
        hint: footnotes.error.hint
      },
      status: 400
    };
  }

  return {
    data: {
      ...recipe,
      tags: tags.data.map(t => t.tag),
      ingredients: ingredients.data.map(i => ({ ingredient: i.ingredient, note: i.note })),
      steps: steps.data.map(s => s.step),
      footnotes: footnotes.data.map(f => f.footnote)
    },
    status: 200,
  }
}

module.exports = {
  addRecipe,
  editRecipe,
  getAllRecipes,
  getRecipesByIds,
  getFullRecipe,
  searchRecipesForMatches,
};