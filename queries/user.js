const { createToken } = require('../helpers/user.js');
const { fetchQuerySingleRow } = require('./helpers.js');

const createUser = async (user) => {
  return fetchQuerySingleRow(
    `INSERT INTO users (first_name, last_name, username, email, password_hash, token)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id, username, token`
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