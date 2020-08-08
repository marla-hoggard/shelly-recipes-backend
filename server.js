const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8000;

const User = require('./models/user.js');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

// Routes
app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})
app.post('/signup', User.signup);


// Start the app on the right port
app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})

