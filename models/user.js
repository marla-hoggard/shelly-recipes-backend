const { hashPassword, checkPassword, createToken } = require('../helpers/user.js');
const { createUser, getUserByUsername, updateUserToken } = require('../queries/user.js');

// Creates a new user - POST /signup
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
    if (user.error) {
      // Checks if the error was for duplicate username or email address
      // Otherwise throws generic error
      if (user.error.constraint === 'users_username_key') {
        return response.status(422).json({ error: `Username ${userReq.username} is taken. Please select another one.` });
      } else if (user.error.constraint === 'users_email_key') {
        return response.status(422).json({ error: `Email ${userReq.email} already has an account. Please log in.` });
      } else {
        return response.status(500).json({ error: user.error.detail || "Something went wrong. Please try again." });
      }
    }
    return response.status(201).json({ user });
  } catch (error) {
    return response.status(500).json({ error: error.detail || "Something went wrong. Please try again." });
  }
};

// Attempts to sign in a user - POST /signin
// Expects username, password in request.body
const signin = async (request, response) => {
  const userReq = request.body;
  if (!userReq.username) {
    return response.status(422).json({ error: "Username is required" });
  }
  if (!userReq.password) {
    return response.status(422).json({ error: "Password is required" });
  }

  const errorMessage = "Username or password is invalid.";

  const user = await getUserByUsername(userReq.username);
  if (user.error) {
    return response.status(401).json({ error: errorMessage});
  }

  const isValidPassword = await checkPassword(user, userReq.password);
  if (isValidPassword) {
    const userToReturn = await updateUserToken(user.id);
    return response.status(200).json({ user: userToReturn });
  } else {
    return response.status(401).json({ error: errorMessage});
  }

};

module.exports = {
  signup,
  signin,
}