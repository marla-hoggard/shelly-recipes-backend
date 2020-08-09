const { getUserByToken } = require('./queries/user.js');

const isAuthenticated = async (req, res, next) => {
  const token = req.headers.token;
  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }

  const user = await getUserByToken(token);
  if (user.error) {
    return res.status(401).send("Access denied. Invalid token.");
  } else {
    req.user = user;
  }
  return next();
}

module.exports = {
  isAuthenticated,
}
