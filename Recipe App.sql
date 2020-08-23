CREATE TYPE category AS ENUM (
  'appetizer',
  'entree',
  'side',
  'dessert',
  'breakfast',
  'beverage',
  'sauce'
);

CREATE TABLE recipes (
  id serial UNIQUE PRIMARY KEY,
  title text NOT NULL,
  source text,
  source_url text,
  submitted_by text,
  servings text,
  category category NOT NULL,
  vegetarian boolean,
  created_at timestamp without time zone NOT NULL
);

CREATE TABLE ingredients (
  id serial UNIQUE PRIMARY KEY,
  ingredient text NOT NULL,
  note text,
  recipe_order int NOT NULL,
  recipe_id int NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE steps (
  id serial UNIQUE PRIMARY KEY,
  step text NOT NULL,
  recipe_order int NOT NULL,
  recipe_id int NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id serial UNIQUE PRIMARY KEY,
  tag text NOT NULL,
  recipe_id int NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE footnotes (
  id serial UNIQUE PRIMARY KEY,
  footnote text NOT NULL,
  recipe_order int NOT NULL,
  recipe_id int NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id serial UNIQUE PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  token uuid
);