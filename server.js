'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();
const PORT = process.env.PORT;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

const app = express();

app.use(cors());

app.get('/location', getLocation);
// app.get('/weather', searchWeather);
// app.get('/yelp', searchFood);
// app.get('/movies', searchMovies);

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

function getLocation(request, response) {
  //Object literal with 3 properperties
  const locationHandler = {
    query: request.query.data,

    cacheHit: (results) => {
      console.log('Got data from SQL');
      response.send(results.rows[0]);
    },

    cacheMiss: () => {
      Location.fetchLocation(request.query.data)
        .then(data => response.send(data));
    },
  };

  Location.lookupLocation(locationHandler);
}

function Location(query, data) {
  console.log('Inside Location constructor.');
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
  console.log('End constuctor: ', this.latitude, this.longitude);
}

Location.lookupLocation = (handler) => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1`;
  const values = [handler.query];

  return client.query( SQL, values )
    .then( results => {
      if ( results.rowCount > 0 ) {
        handler.cacheHit(results);
      } else {
        handler.cacheMiss();
      }
    })
    .catch( console.error );
}

Location.fetchLocation = (query) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(apiResponse => {
      console.log('Looking at apiResponse.body.results.length:', apiResponse.body.results.length);
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
        // return location;
      }
    })
    .catch(error => handleError(error));
}

Location.prototype.save = function() {
  let SQL = `INSERT INTO locations 
    (search_query, formatted_query, latitude, longitude) 
    VALUES ($1, $2, $3, $4) RETURNING id`;

  let values = Object.values(this);
  return client.query(SQL, values);
};

function searchWeather(req, res) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${req.query.data.latitude},${req.query.data.longitude}`;

  return superagent.get(url)
    .then((weatherResponse) => {
      const weatherSummaries = weatherResponse.body.daily.data.map((day) => {
        return new Weather(day);
      });
      res.send(weatherSummaries);
    })
    .catch((err) => handleError(err, res));
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000)
    .toLocaleDateString('en-US', {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'});
}

function searchFood(req, res) {
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${req.query.data.latitude}&longitude=${req.query.data.longitude}`;

  return superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then((foodResponse) => {
      const foodReviews = foodResponse.body.businesses.map((restaurant) => {
        return new Food(restaurant);
      });
      res.send(foodReviews);
    })
    .catch((err) => handleError(err, res));
}

function Food(restaurant) {
  this.name = restaurant.name;
  this.url = restaurant.url;
  this.rating = restaurant.rating;
  this.price = restaurant.price;
  this.image_url = restaurant.image_url;
}

function searchMovies(req, res) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${req.query.data.search_query}`;

  return superagent.get(url)
    .then((moviesResponse) => {
      const areaMovies = moviesResponse.body.results.map((movie) => {
        return new Movie(movie);
      });
      res.send(areaMovies);
    })
    .catch((err) => handleError(err, res));
}

function Movie(movie) {
  this.title = movie.title;
  this.released_on = movie.release_date;
  this.total_votes = movie.vote_count;
  this.average_votes = movie.vote_average;
  this.popularity = movie.popularity;
  this.image_url = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'http://media.graytvinc.com/images/810*607/Movie32.jpg';
  this.overview = movie.overview;
}

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Looks like today\'s not your day');
}
