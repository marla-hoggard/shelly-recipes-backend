const bcrypt = require('bcrypt');
const crypto = require('crypto');

const hashPassword = password => {
  return new Promise((resolve, reject) => {
    return bcrypt.hash(password, 10, (err, hash) => {
      err ? reject(err) : resolve(hash);
    })
  }
  );
};

const createToken = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, data) => {
      err ? reject(err) : resolve(data.toString('base64'));
    });
  });
};

module.exports = {
  hashPassword,
  createToken,
}