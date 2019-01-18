DROP TABLE IF EXISTS weathers;
DROP TABLE IF EXISTS foods;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(8, 6),
  longitude NUMERIC(9, 6)
  );

CREATE TABLE weathers (
  id SERIAL PRIMARY KEY,
  forecast VARCHAR(255),
  time VARCHAR(255),
  location_id INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations (id)
  );

CREATE TABLE foods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  url VARCHAR(2083),
  rating NUMERIC(2, 1),
  price VARCHAR(255),
  image_url VARCHAR(2083),
  location_id INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations (id)
  );

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  released_on VARCHAR(255),
  total_votes INTEGER NOT NULL,
  average_votes NUMERIC(2, 1),
  popularity NUMERIC(5, 1),
  image_url VARCHAR(2083),
  overview VARCHAR(2083),
  location_id INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations (id)
  );
