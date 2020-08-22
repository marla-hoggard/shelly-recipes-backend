const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const knex = require('knex')(configuration);

const queryError = error => {
  const [query, message] = error.message.split(" - ");
  console.error({ error: message, query });
  return { error: {...error, details: message, query } };
}

// Returns the first row from the result of @query
// If there is no data found, returns object with key 'error'
// If an error is thrown on the query, logs it and returns object with key 'error'
const fetchQuerySingleRow = async (query) => {
  try {
    const data = await query();
    if (data.length) {
      return data[0];
    } else {
      return {
        error: "No data found.",
      };
    }
  }
  catch (error) {
    return queryError(error);
  }
};

// Returns all rows from the result of @query
// If there is an error, logs the error and returns it as key 'error'
const fetchQuery = async (query) => {
  try {
    const data = await query();
    return { data };
  }
  catch (error) {
    return queryError(error);
  }
};

const insertViaTrx = async (trx, name, toAdd, recipe_id) => {
  try {
    const inserted = await trx(name).insert(toAdd);
    console.log(`${inserted.rowCount} ${name} added for ${recipe_id}.`);
    return { data: inserted };
  } catch (error) {
    const response = queryError(error);
    return {
      error: {
        details: response.error.details || response.error.query,
        message: `Error adding ${name}.`
      }
    };
  }
}

const deleteAndInsertViaTrx = async (trx, name, toAdd, recipe_id) => {
  try {
    const deleteCount = await knex(name).where('recipe_id', recipe_id).del();
    console.log(`${deleteCount} ${name} deleted.`);
  } catch (error) {
    const response = queryError(error);
    return {
      error: {
        details: response.error.details || response.error.query,
        message: `Error deleting ${name}.`,
        status: 400,
      }
    };
  }

  return await insertViaTrx(trx, name, toAdd, recipe_id);
}

module.exports = {
  fetchQuery,
  fetchQuerySingleRow,
  insertViaTrx,
  deleteAndInsertViaTrx,
  queryError,
};