require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8000;

const Recipe = require('./models/recipe.js');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

const allowedOrigins = [
  process.env.FRONTEND_BASE_URL_LOCAL,
  process.env.FRONTEND_BASE_URL_IP,
  process.env.FRONTEND_BASE_URL_PROD
].map(domain => new RegExp(`https?${domain.replace(/https?/, '')}`))

const corsOptions = {
  origin: allowedOrigins,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Routes
app.get('/', (request, response) => {
  response.json({ info: 'API made with Node.js and PostgreSQL for sharing recipes.' })
});

// Recipe Routes
app.get('/recipes', Recipe.getAllRecipes);
app.get('/recipe/:id', Recipe.getRecipe);
app.post('/recipe/new', Recipe.addRecipe);
app.put('/recipe/:id', Recipe.editRecipe);
app.get('/search', Recipe.searchRecipes);

app.get('/submitters', Recipe.listSubmitters);

// Start the app on the right port
app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})

