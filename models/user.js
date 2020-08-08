const { hashPassword, createToken } = require('../helpers/user.js');
const { createUser } = require('../queries/user.js');

// Creates a new user - POST to /signup
// Expects first_name, last_name, username, email, password in request.body
const signup = async (request, response) => {
  const userReq = request.body;

  if (!userReq.first_name) {
    return response.status(422).json({ error: "First name is required" });
  }
  if (!userReq.last_name) {
    return response.status(422).json({ error: "Last name is required" });
  }
  if (!userReq.email) {
    return response.status(422).json({ error: "Email is required" });
  }
  if (!userReq.username) {
    return response.status(422).json({ error: "Username is required" });
  }
  if (!userReq.password) {
    return response.status(422).json({ error: "Password is required" });
  }

  try {
    const hashedPassword = await hashPassword(userReq.password);
    delete userReq.password;
    userReq.password_hash = hashedPassword;

    userReq.token = await createToken();

    const user = await createUser(userReq);
    return response.status(201).json({ user });
  } catch (error) {
    if (error.constraint === 'users_username_key') {
      return response.status(422).json({ error: `Username ${userReq.username} is taken. Please select another one.` });
    } else if (error.constraint === 'users_email_key') {
      return response.status(422).json({ error: `Email ${userReq.email} already has an account. Please log in.` });
    } else {
      return response.status(500).json({ error: error.detail });
    }
  }
}

module.exports = {
  signup,
}