const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const knex = require('knex')(configuration);

const { createToken } = require('../helpers/user.js');
const { fetchQuerySingleRow, fetchQuery } = require('./helpers.js');

const createUser = async (user) => {
  const query = () => {
    return knex('users').insert({ ...user }, ['id', 'username', 'token'])
  }
  return fetchQuerySingleRow(query);
};

const getUserByUsername = async (username) => {
  const query = () => knex.select('*').from('users').where('username', 'ilike', username);
  return fetchQuerySingleRow(query);
};

const getUserById = async (userId) => {
  const query = () => knex.select('*').from('users').where('id', userId);
  return fetchQuerySingleRow(query);
};

const getUserByToken = async (token) => {
  const query = () => knex.select('*').from('users').where({ token });
  return fetchQuerySingleRow(query);
};

const updateUserQuery = async (userId, toUpdate) => {
  const query = () => {
    return knex('users')
      .where('id', userId)
      .update(
        toUpdate,
        ['id', 'username', 'first_name', 'last_name', 'email']
      );
  }

  return fetchQuerySingleRow(query);
}

const updateUserToken = async (userId) => {
  const token = await createToken();
  const query = () => {
    return knex('users')
      .where('id', userId)
      .update(
        { token },
        ['id', 'username', 'token']
      );
  };
  return fetchQuerySingleRow(query);
}

const clearUserToken = async (userId) => {
  const query = () => {
    return knex('users')
      .where('id', userId)
      .update(
        { token: null },
        ['id', 'username', 'token'],
      );
  };
  return fetchQuerySingleRow(query);
}

const deleteUser = async (userId) => {
  const query = () => knex('users').where('id', userId).del();
  return fetchQuery(query);
}

module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  getUserByToken,
  updateUserQuery,
  updateUserToken,
  clearUserToken,
  deleteUser,
};