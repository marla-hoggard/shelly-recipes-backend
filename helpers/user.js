const bcrypt = require('bcrypt');

const hashPassword = async password => {
  return await bcrypt.hash(password, 10);
};

const checkPassword = async (user, password) => {
  return await bcrypt.compare(password, user.password_hash);
}

// Checks if the @token matches that of the user with id @userId
// Returns true or false
const checkAuthentication = async (userId, token) => {

}

module.exports = {
  hashPassword,
  checkPassword,
}