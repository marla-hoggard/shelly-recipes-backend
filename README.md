# Authentication API Starter Code
This repo contains an API for the basic CRUD operations required for user management and authentication. It is set up to use Node.js and Express and connects to a PostgreSQL via knex. It uses `nodemon` for starting the server and hot reloading. This repo can be used as starter code for any Node/PostgreSQL project that requires user authentication.

To use this template, simply click "Use this template" and follow the on-screen instructions.

## Setup
1. Create a PostgreSQL database
2. Open `knexfile.js` and update the `connection` for each environment to point to your database. Note: To use in production, you will need to create a `.env` file and include a `DATABASE_URL` variable.
3. Create a `users` table in your database. This API is set up to expect the following columns. You may update those columns as needed, such as using specific-length varchar rather than text. If you add or remove columns, you will need to update some of the endpoints accordingly.
```
CREATE TABLE users (
  id SERIAL UNIQUE PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  token uuid
);
```
4. Run `yarn` to install dependencies
5. Run `yarn start` to start the server.

The app is configured with hot-reloading, so any saved changes will automatically restart the server. Any errors and console logs can be viewed in the terminal window where you started the server.

### Authentication Method

Sessions/authentication are handled via tokens. When a user signs up or logs in, a token is generated and stored in the users database. When the user hits `/signout`, the token is destroyed. A client should store the token in web storage, such as session storage, and pass it in the header with any API call that is gated by the `isAuthenticated` middleware.

In this current iteration, these are just arbitrary tokens. They cannot be decoded to reveal any information, like with JWT, and they do not have any particular expiration date. For higher security, you could switch to JWT or add an expiration column to the users table and a refresh token endpoint. The app this was originally created for will not store any personal information in users, so this style of authentication was secure enough.

### isAuthenticated Middleware

This API includes an `isAuthenticated` middleware function. It expects the auth token as `token` in the request header. If the token is not sent or is not found in the users table, the API will throw a 401 for Access Denied. If the token is valid, the whole user object from the table will be added as `request.user` for use in the given endpoint function. To use, simply pass `isAuthenticated` as the second argument to the route declaration, between the path and the endpoint function.