const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

// Returns the first row from the result of @query with @vars
// If there is no data found, returns object with key 'error'
// If an error is thrown on the query, logs it and returns object with key 'error'
const fetchQuerySingleRow = async (query, vars) => {
  try {
    const data = await database.raw(query, vars);
    if (data.rows.length) {
      return data.rows[0];
    } else {
      return {
        error: "No data found.",
      };
    }
  }
  catch (error) {
    const [query, message] = error.message.split(" - ");
    console.error({ error: message, query });
    return { error };
  }
};

// Returns all rows from the result of @query with @vars
// If there is an error, logs the error and returns it as key 'error'
const fetchQueryAllRows = async (query, vars) => {
  try {
    const data = await database.raw(query, vars);
    return data.rows;
  }
  catch (error) {
    const [query, message] = error.message.split(" - ");
    console.error({ error: message, query });
    return { error };
  }
};

// Accepts a delete query and its variables
// Returns the number of rows that were deleted
const sendDeleteQuery = async (query, vars) => {
  try {
    const data = await database.raw(query, vars);
    return data.rowCount;
  }
  catch (error) {
    const [query, message] = error.message.split(" - ");
    console.error({ error: message, query });
    return { error };
  }
};

module.exports = {
  fetchQuerySingleRow,
  fetchQueryAllRows,
  sendDeleteQuery,
}