const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

const { createToken } = require('../helpers/user.js');

// Returns the first row from the result of @query with @vars
const fetchQuerySingleRow = async (query, vars) => {
  const data = await database.raw(query, vars);
  if (data && data.rows[0]) {
    return data.rows[0];
  }
  else {
    return {
      error: {
        detail: "Something went wrong.",
      },
    };
  }
};

// Returns all rows from the result of @query with @vars
const fetchQueryAllRows = async (query, vars) => {
  const data = await database.raw(query, vars);
  if (data && data.rows) {
    return data.rows;
  }
  else {
    return {
      error: {
        detail: "Something went wrong.",
      },
    };
  }
};

const createUser = async (user) => {
  return fetchQuerySingleRow(
      "INSERT INTO users (first_name, last_name, username, email, password_hash, token) \
        VALUES (?, ?, ?, ?, ?, ?) \
        RETURNING id, username, token"
    ,
    [user.first_name, user.last_name, user.username, user.email, user.password_hash, user.token],
  );
};

const getUserByUsername = async (username) => {
  return fetchQuerySingleRow(
    "SELECT * FROM users WHERE username = ?",
    [username],
  )
};

const updateUserToken = async (userId) => {
  const token = await createToken();
  return fetchQuerySingleRow(
    `UPDATE users
      SET token = ?
      WHERE id = ?
      RETURNING id, username, token
    `,
    [token, userId],
  )
}

module.exports = {
  createUser,
  getUserByUsername,
  updateUserToken,
};