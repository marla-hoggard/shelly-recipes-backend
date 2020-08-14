const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8000;

const { isAuthenticated } = require('./middleware.js');
const Recipe = require('./models/recipe.js');
const User = require('./models/user.js');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Routes
app.get('/', (request, response) => {
  response.json({ info: 'API made with Node.js and PostgreSQL for storing recipes.' })
});

// Recipe Routes
app.post('/recipe/new', Recipe.addRecipe);

// User Routes
app.post('/signup', User.signup);
app.post('/signin', User.signin);
app.post('/signout', isAuthenticated, User.signout);
app.get('/user/:username', User.getUserProfile);
app.put('/user/:id', isAuthenticated, User.updateUser);
app.delete('/user/:id', isAuthenticated, User.deleteUser);

// Start the app on the right port
app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})

