# City Explorer

**Author**: Milo & Jessica
**Version**: 1.0.1 (increment the patch/fix version number if you make more commits past your first submission)

## Overview
This is a backend server app that retreives information about a city. It returns map data, weather forecasts, nearby restaurants, meetups, trails, and movies set in the given city.

## Getting Started
After you clone the repo, you will need to run 'npm i' in your console to install the dependencies. You will also need to create an .env file and add a PORT number and your own API keys, e.g.:

PORT=3000
GEOCODE_API_KEY=[api_key]
WEATHER_API_KEY=[api_key]
YELP_API_KEY=[api_key]
MOVIE_API_KEY=[api_key]

## Architecture
This app depends on express, cors, superagent, and dotenv. It reads incoming query parameters and uses a superagent 'get()' call to return data from various APIs, which is then parsed into an object and returned to the client. 

## Change Log
01-16-2019 10:00am - Refactored, application now has functioning routes for /location, /weather
01-16-2019 11:00am - Added route and API functionality for /yelp restaurants
01-16-2019 11:45am - Added route and API functionality for /movies
01-17-2019 12:30pm - Refactored, server application to implement SQL queries and execute code based on results of SQL query for the location and weather constructor.
01-17-2019 1:30pm - Refactored server application for the yelp constructor. 
01-17-2019 4:30pm - 5:45pm - Refactored server application for the movie constructor.
01-18-2019 9:30am - Updated server application to deploy heroku.

<!-- Use this area to document the iterative changes made to your application as each feature is successfully implemented. Use time stamps. Here's an examples:

01-01-2001 4:59pm - Application now has a fully-functional express server, with a GET route for the location resource.
-->
## Credits and Collaborations
Code that was refactored today was based on a collaboration with Chris B and Milo A yesterday.
Code was refactored yesterday from collaboration between Paul Williamsen, Jessica Roland and Jasmin Arensdorf.
<!-- Give credit (and a link) to other people or resources that helped you build this application. -->

> Number and name of feature: Yelp API
> Estimate of time needed to complete: 1:00
> Start time: 10:00
> Finish time: 11:00
> Actual time needed to complete: 1:00

> Number and name of feature: Movies API
> Estimate of time needed to complete: 1:00
> Start time: 11:00
> Finish time: 11:40
> Actual time needed to complete: 0:40

Number and name of feature: Adding SQL Database for Location and Weather
> Estimate of time needed to complete: 2:00
> Start time: 9:00
> Finish time: 12:30
> Actual time needed to complete: 3:00

Number and name of feature: Adding SQL Database for Yelp 
> Estimate of time needed to complete: 45 min
> Start time: 1:00
> Finish time: 1:30
> Actual time needed to complete: 30 min

Number and name of feature: Adding SQL Database for Movies
> Estimate of time needed to complete: 30 min
> Start time: 4:30
> Finish time: 5:45
> Actual time needed to complete: 1:15 

Number and name of feature: Deployment of City Explorer
> Estimate of time needed to complete: 5 min
> Start time: 9:00
> Finish time: 9:20
> Actual time needed to complete: 20 min

