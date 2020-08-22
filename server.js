require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8000;

const { isAuthenticated } = require('./middleware.js');
const Recipe = require('./models/recipe.js');
const User = require('./models/user.js');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

const corsOptions = {
  origin: [process.env.FRONTEND_BASE_URL_LOCAL, /herokuapp\.com$/],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Routes
app.get('/', (request, response) => {
  response.json({ info: 'API made with Node.js and PostgreSQL for storing recipes.' })
});

// Recipe Routes
app.get('/recipes', Recipe.getAllRecipes);
app.get('/recipe/:id', Recipe.getRecipe);
app.post('/recipe/new', Recipe.addRecipe); // TODO: Require authentication
app.put('/recipe/:id', Recipe.editRecipe); // TODO: Require auth and that user is admin or matches "submitted by"

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

