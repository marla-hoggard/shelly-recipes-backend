CREATE TABLE recipes (
  id serial UNIQUE PRIMARY KEY,
  title text NOT NULL,
  submitted_by text,
  message text,
  servings text,
  is_confirmed boolean,
  created_at timestamp without time zone NOT NULL
);

CREATE TABLE ingredients (
  id serial UNIQUE PRIMARY KEY,
  ingredient text NOT NULL,
  recipe_order int NOT NULL,
  recipe_id int NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE steps (
  id serial UNIQUE PRIMARY KEY,
  step text NOT NULL,
  recipe_order int NOT NULL,
  recipe_id int NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE footnotes (
  id serial UNIQUE PRIMARY KEY,
  footnote text NOT NULL,
  recipe_order int NOT NULL,
  recipe_id int NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);