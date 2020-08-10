const queryError = error => {
  const [query, message] = error.message.split(" - ");
  console.error({ error: message, query });
  return { error: {...error, details: message } };
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
    return await query();
  }
  catch (error) {
    return queryError(error);
  }
};

module.exports = {
  fetchQuery,
  fetchQuerySingleRow,
};