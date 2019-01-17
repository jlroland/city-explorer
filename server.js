'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

require('dotenv').config();
const PORT = process.env.PORT;

const app = express();

app.use(cors());

app.get('/location', searchToLatLong);
app.get('/weather', searchWeather);
app.get('/yelp', searchFood);
app.get('/movies', searchMovies);

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

function searchToLatLong(req, res) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then((apiResponse) => {
      let location = new Location(req.query.data, apiResponse);
      res.send(location);
    })
    .catch((err) => handleError(err, res));
}

function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

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
