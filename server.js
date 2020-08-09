const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8000;

const { isAuthenticated } = require('./middleware.js');
const User = require('./models/user.js');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

// Routes
app.get('/', (request, response) => {
  response.json({ info: 'API made with Node.js and PostgreSQL for storing recipes.' })
});
app.post('/signup', User.signup);
app.post('/signin', User.signin);
app.post('/signout', isAuthenticated, User.signout);
app.delete('/user/:id', isAuthenticated, User.deleteUser);


// Start the app on the right port
app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})

