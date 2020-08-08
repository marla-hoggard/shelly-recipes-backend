const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

const createUser = async (user) => {
  const data = await database.raw("INSERT INTO users (first_name, last_name, username, email, password_hash, token) \
      VALUES (?, ?, ?, ?, ?, ?) \
      RETURNING id, username, token"
    ,
    [user.first_name, user.last_name, user.username, user.email, user.password_hash, user.token],
  );
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

module.exports = {
  createUser,
};