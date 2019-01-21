'use strict';

// Application dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Load environment from .env file
require('dotenv').config();
const PORT = process.env.PORT;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

// Instantiate an express object.  We now have access to all the express method (e.g. app.get, app.use, app.listen).
const app = express();

// This is middleware that gets permissions to allow client and server to communicate
app.use(cors());

// Route handlers
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/yelp', getFood);
app.get('/movies', getMovies);
app.get('/meetups', getMeetups);
app.get('/trails', getTrails)

// Application setup
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

const timeouts = {
  weather: 1000 * 15,
  food: 1000 * 60 * 60 * 24,
  movie: 1000 * 60 * 60 * 24 * 7 * 4 * 12,
  meetup: 1000 * 60 * 60 * 12,
  trail: 1000 * 60 * 60 * 6
}

function deleteByLocationId(table, cityId) {
  const SQL = `DELETE from ${table} WHERE location_id=${cityId}`;
  return client.query(SQL);
}

/*  Error handler functions
-------------------------------------------*/
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Looks like today\'s not your day');
}

/*  Helper Functions
-------------------------------------------*/
function getLocation(request, response) {
  //Object literal with 3 properperties
  const locationHandler = {
    query: request.query.data,

    cacheHit: (results) => {
      console.log('Got Location data from SQL');
      response.send(results.rows[0]);
    },

    cacheMiss: () => {
      Location.fetch(request.query.data)
        .then(data => response.send(data));
    },
  };

  Location.lookup(locationHandler);
}

function getMeetups(request, response) {
  //Object literal with 3 properties
  const locationHandler = {
    location: request.query.data,

    cacheHit: (results) => {
      // Determine if movie information is stale or current
      let ageOfResults = (Date.now() - results.rows[0].created_at);
      console.log('Got Meetup data from SQL');
      console.log('Meetup result.rows: ', results.rows[0].created_at);
      console.log('age: ', ageOfResults);
      console.log('timeout', timeouts.meetup);

      if (ageOfResults > timeouts.meetup) {
        deleteByLocationId('meetups', this.location.id);
        this.cacheMiss();
      } else {
        response.send(results.rows);
      }
    },

    cacheMiss: () => {
      Meetup.fetch(request.query.data)
        .then(data => response.send(data))
        .catch(console.error);
    },
  };

  Meetup.lookup(locationHandler);
}

function getTrails(request, response) {
  //Object literal with 3 properperties
  const locationHandler = {
    location: request.query.data,

    cacheHit: (results) => {
      // Determine if movie information is stale or current
      let ageOfResults = (Date.now() - results.rows[0].created_at);
      console.log('Trail result.rows', results.rows[0].created_at);
      console.log('age: ', ageOfResults);
      console.log('timeout: ', timeouts.trail);

      if (ageOfResults > timeouts.trail) {
        deleteByLocationId('trails', this.location.id);
        this.cacheMiss();
      } else {
        response.send(results.rows);
      }
    },

    cacheMiss: () => {
      Trail.fetch(request.query.data)
        .then(data => response.send(data))
        .catch(console.error);
    },
  };

  Trail.lookup(locationHandler);
}

function getWeather(request, response) {
  const handler = {
    location: request.query.data,

    cacheHit: function(result) {
      // Determine if movie information is stale or current
      let ageOfResults = (Date.now() - result.rows[0].created_at);
      console.log('Weather result.rows', result.rows[0].created_at);
      console.log('age', ageOfResults);
      console.log('timeout', timeouts.weather);

      if (ageOfResults > timeouts.weather) {
        deleteByLocationId('weathers', this.location.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      Weather.fetch(request.query.data)
        .then(results => response.send(results))
        .catch(console.error);
    },
  };

  Weather.lookup(handler);
}

function getFood(request, response) {
  const handler = {
    location: request.query.data,

    cacheHit: function(result) {
      // Determine if food information is stale or current
      let ageOfResults = (Date.now() - result.rows[0].created_at);
      console.log('Food result.rows', result.rows[0].created_at);
      console.log('age: ', ageOfResults);
      console.log('timeout: ', timeouts.food);

      if(ageOfResults > timeouts.food) {
        deleteByLocationId('foods', this.location.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      Food.fetch(request.query.data)
        .then(results => response.send(results))
        .catch(console.error);
    },
  };

  Food.lookup(handler);
}

function getMovies(request, response) {
  const handler = {
    location: request.query.data,

    cacheHit: function(result) {
      // Determine if movie information is stale or current
      let ageOfResults = (Date.now() - result.rows[0].created_at);
      console.log('Movie result.rows: ', result.rows[0].created_at);
      console.log('age: ', ageOfResults);
      console.log('timeout', timeouts.movie);

      if (ageOfResults > timeouts.movie) {
        deleteByLocationId('movies', this.location.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      Movie.fetch(request.query.data)
        .then(results => response.send(results))
        .catch(console.error);
    },
  };

  Movie.lookup(handler);
}

/*  Constructors
-------------------------------------------*/
function Location(query, data) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
}

Location.prototype.save = function() {
  let SQL = `INSERT INTO locations 
    (search_query, formatted_query, latitude, longitude) 
    VALUES ($1, $2, $3, $4) RETURNING id`;

  let values = Object.values(this);
  return client.query(SQL, values);
};

Location.fetch = (query) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(apiResponse => {
      if ( !apiResponse.body.results.length ) {
        throw 'No Data';
      }
      else {
        let location = new Location(query, apiResponse.body.results[0]);
        return location.save()
          .then( results => {
            location.id = results.rows[0].id;
            return location;
          })
      }
    })
    .catch(error => handleError(error));
}

Location.lookup = (handler) => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1`;
  const values = [handler.query];

  return client.query( SQL, values )
    .then( results => {
      if ( results.rowCount > 0 ) {
        console.log('Got Location data from SQL');
        handler.cacheHit(results);
      } else {
        console.log('Got Location data from API');
        handler.cacheMiss();
      }
    })
    .catch( console.error );
}

function Food(restaurant) {
  this.name = restaurant.name;
  this.url = restaurant.url;
  this.rating = restaurant.rating;
  this.price = restaurant.price;
  this.image_url = restaurant.image_url;
  this.created_at = Date.now();
}

Food.prototype.save = function(id) {
  const SQL = `INSERT INTO foods 
    (name, url, rating, price, image_url, created_at, location_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7);`;
  const values = Object.values(this);
  values.push(id);
  client.query(SQL, values);
};

Food.fetch = function(location) {
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${location.latitude}&longitude=${location.longitude}`;

  return superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then((foodResponse) => {
      const foodReviews = foodResponse.body.businesses.map((restaurant) => {
        const foodSummary = new Food(restaurant);
        foodSummary.save(location.id);
        return foodSummary;
      });
      return foodReviews;
    })
    .catch((error) => handleError(error));
}

Food.lookup = function(handler) {
  const SQL = `SELECT * FROM foods WHERE location_id=$1;`;
  client.query(SQL, [handler.location.id])
    .then(result => {
      if ( result.rowCount > 0 ) {
        console.log('Got Food data from SQL');
        handler.cacheHit(result);
      }
      else {
        console.log('Got Food data from API');
        handler.cacheMiss();
      }
    })
    .catch(error => handleError(error));
};

function Meetup(events) {
  this.link = events.event_url;
  this.name = events.name;
  this.creation_date = new Date(events.created).toString().slice(0, 15);
  this.host = events.group.name;
  this.created_at = Date.now();
}

Meetup.prototype.save = function(id) {
  let SQL = `INSERT INTO meetups 
    (link, name, creation_date, host, created_at, location_id) 
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;

  let values = Object.values(this);
  values.push(id);
  return client.query(SQL, values);
};

Meetup.fetch = (location) => {
  const url = `https://api.meetup.com/find/upcoming_events?&lon=${location.longitude}&page=20&lat=${location.latitude}&key=${process.env.MEETUP_API_KEY}`;

  return superagent.get(url)
    .then((meetupResponse) => {
      const areaMeetups = meetupResponse.body.events.map((meetup) => {
        const summary = new Meetup(meetup);
        summary.save(location.id);
        return summary;
      });
      return areaMeetups;
    })
    .catch((error) => handleError(error));
}

Meetup.lookup = (handler) => {
  const SQL = `SELECT * FROM meetups WHERE location_id=$1;`;
  client.query(SQL, [handler.location.id])
    .then(result => {
      if ( result.rowCount > 0 ) {
        console.log('Got Meetup data from SQL');
        handler.cacheHit(result);
      }
      else {
        console.log('Got Meetup data from API');
        handler.cacheMiss();
      }
    })
    .catch(error => handleError(error));
}

function Movie(movie) {
  this.title = movie.title;
  this.released_on = movie.release_date;
  this.total_votes = movie.vote_count;
  this.average_votes = movie.vote_average;
  this.popularity = movie.popularity;
  this.image_url = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'http://media.graytvinc.com/images/810*607/Movie32.jpg';
  this.overview = movie.overview;
  this.created_at = Date.now();
}

Movie.prototype.save = function(id) {
  const SQL = `INSERT INTO movies 
    (title, released_on, total_votes, average_votes, popularity, image_url, overview, created_at, location_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
  const values = Object.values(this);
  values.push(id);
  client.query(SQL, values);
};

Movie.fetch = function (location) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${location.search_query}`;

  return superagent.get(url)
    .then((moviesResponse) => {
      const areaMovies = moviesResponse.body.results.map((movie) => {
        const summary = new Movie(movie);
        summary.save(location.id);
        return summary;
      });
      return areaMovies;
    })
    .catch((error) => handleError(error));
}

Movie.lookup = function(handler) {
  const SQL = `SELECT * FROM movies WHERE location_id=$1;`;
  client.query(SQL, [handler.location.id])
    .then(result => {
      if ( result.rowCount > 0 ) {
        console.log('Got Movie data from SQL');
        handler.cacheHit(result);
      }
      else {
        console.log('Got Movie data from API');
        handler.cacheMiss();
      }
    })
    .catch(error => handleError(error));
};

function Trail(hike) {
  this.trail_url = hike.url;
  this.name = hike.name;
  this.location = hike.location;
  this.length = hike.length;
  this.condition_date = hike.conditionDate.split(' ')[0];
  this.condition_time = hike.conditionDate.split(' ')[1];
  this.conditions = hike.conditionDetails;
  this.stars = hike.stars;
  this.star_votes = hike.starVotes;
  this.summary = hike.summary;
  this.created_at = Date.now();
}

Trail.prototype.save = function(id) {
  const SQL = `INSERT INTO trails 
    (trail_url, name, location, length, condition_date, condition_time, conditions, stars, star_votes, summary, created_at, location_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;
  const values = Object.values(this);
  values.push(id);
  client.query(SQL, values);
};

Trail.fetch = function(location) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${location.latitude}&lon=${location.longitude}&key=${process.env.HIKING_API_KEY}`;

  return superagent.get(url)
    .set('Authorization', `Bearer ${process.env.HIKING_API_KEY}`)
    .then((trailResponse) => {
      const trailReviews = trailResponse.body.trails.map((trails) => {
        const trailSummary = new Trail(trails);
        trailSummary.save(location.id);
        return trailSummary;
      });
      return trailReviews;
    })
    .catch((error) => handleError(error));
}

Trail.lookup = function(handler) {
  const SQL = `SELECT * FROM trails WHERE location_id=$1;`;
  client.query(SQL, [handler.location.id])
    .then(result => {
      if ( result.rowCount > 0 ) {
        console.log('Got Trail data from SQL');
        handler.cacheHit(result);
      }
      else {
        console.log('Got Trail data from API');
        handler.cacheMiss();
      }
    })
    .catch(error => handleError(error));
};

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
  this.created_at = Date.now();
}

Weather.prototype.save = function(id) {
  const SQL = `INSERT INTO weathers 
    (forecast, time, created_at, location_id) 
    VALUES ($1, $2, $3, $4);`;
  const values = Object.values(this);
  values.push(id);
  client.query(SQL, values);
};

Weather.fetch = function(location) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${location.latitude},${location.longitude}`;

  return superagent.get(url)
    .then((result => {
      const weatherSummaries = result.body.daily.data.map((day) => {
        const summary = new Weather(day);
        summary.save(location.id);
        return summary;
      });
      return weatherSummaries;
    }))
    .catch((error) => handleError(error));
};

Weather.lookup = function(handler) {
  const SQL = `SELECT * FROM weathers WHERE location_id=$1;`;
  client.query(SQL, [handler.location.id])
    .then(result => {
      if ( result.rowCount > 0 ) {
        console.log('Got Weather data from SQL');
        handler.cacheHit(result);
      }
      else {
        console.log('Got Weather data from API');
        handler.cacheMiss();
      }
    })
    .catch(error => handleError(error));
};
