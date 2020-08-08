const bcrypt = require('bcrypt');
const crypto = require('crypto');

const hashPassword = async password => {
  return new Promise((resolve, reject) => {
    return bcrypt.hash(password, 10, (err, hash) => {
      err ? reject(err) : resolve(hash);
    })
  }
  );
};

const checkPassword = async (user, password) => {
  return new Promise((resolve, reject) =>
    bcrypt.compare(password, user.password_hash, (err, response) => {
      if (response) {
        resolve(response);
      } else {
        reject(err || new Error('Passwords do not match.'));
      }
    }),
  );
}

const createToken = async () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, data) => {
      err ? reject(err) : resolve(data.toString('base64'));
    });
  });
};

module.exports = {
  hashPassword,
  checkPassword,
  createToken,
}