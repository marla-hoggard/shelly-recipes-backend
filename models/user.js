const { hashPassword, checkPassword, createToken } = require('../helpers/user.js');
const {
  createUser,
  getUserByUsername,
  getUserById,
  updateUserToken,
  clearUserToken,
  deleteUser: deleteUserQuery,
} = require('../queries/user.js');

// Creates a new user - POST /signup
// Expects first_name, last_name, username, email, password in request.body
const signup = async (request, response) => {
  const userReq = request.body;

  if (!userReq.first_name) {
    return response.status(400).json({ error: "First name is required" });
  }
  if (!userReq.last_name) {
    return response.status(400).json({ error: "Last name is required" });
  }
  if (!userReq.email) {
    return response.status(400).json({ error: "Email is required" });
  }
  if (!userReq.username) {
    return response.status(400).json({ error: "Username is required" });
  }
  if (!userReq.password) {
    return response.status(400).json({ error: "Password is required" });
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
    return response.status(400).json({ error: "Username is required" });
  }
  if (!userReq.password) {
    return response.status(400).json({ error: "Password is required" });
  }

  const user = await getUserByUsername(userReq.username);
  if (user.error) {
    return response.status(401).json({ error: "Username or password is invalid."});
  }

  const isValidPassword = await checkPassword(user, userReq.password);
  if (isValidPassword) {
    const userToReturn = await updateUserToken(user.id);
    return userToReturn.error
      ? response.status(500).json({ error: user.error })
      : response.status(200).json({ user: userToReturn });
  } else {
    return response.status(401).json({ error: "Username or password is invalid."});
  }
};

// Attempts to sign out a user - POST /signout
// Must be signed to access => Expects @token in header
const signout = async (request, response) => {
  const result = await clearUserToken(request.user.id);
  return result.error
    ? response.status(500).json({ error: "Something went wrong. User token not removed." })
    : response.status(200).send("User successfully signed out.");
}

// Attempts to delete the user with id :id - DELETE /user/:id
// Requires a @token to be sent in the header
// @token must match that of the user with @id
const deleteUser = async (request, response) => {
  const id = parseInt(request.params.id);

  // Verify that the current user is the user to delete
  if (request.user.id !== id) {
    return response.status(401).json({ error: "Access denied. You do not have permission to delete this user."});
  }

  const result = await deleteUserQuery(id);
  if (result.error) {
    return response.status(500).json({ error: result.error });
  }

  return result > 0
    ? response.status(200).send("User successfully deleted.")
    : response.status(404).json({ error: `No user found.`});
}

module.exports = {
  signup,
  signin,
  signout,
  deleteUser,
}