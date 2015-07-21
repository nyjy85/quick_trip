var router = require('express').Router();
var cheerio = require('cheerio');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var url = require('url');
var async = require('async');
var path = require('path');

function clientError(e) {
    return e.code >= 400 && e.code < 500;
}
var arrayOfCoordinates = [];

router.get('/:query', function(req, res, next){
	
	var query = req.params.query;
	var searchUrl = 'http://www.tripadvisor.com/Search?q=';

	request(searchUrl + query).then(function(res){
		// goes the search page
		var $ = cheerio.load(res[0].body);
		var thingsToDo = $('.srGeoLinks a').filter(function(link){return $(this).text().indexOf("Things to Do") > -1});
		var ahref = thingsToDo.attr('href');
		var path = url.resolve(searchUrl, ahref);
		return path;
	}).then(function(path){
		return request(path).then(function(res){
			// goes to that country's page via Things To Do
			var $ = cheerio.load(res[0].body);
			var top30 = $('.property_title a');
			// filters out all tours/services/lessons/services
			return top30.filter(function(ref){return check($(this).text())}).map(function(idx, destination){
				var ahref = $(this).attr('href');
				var path = url.resolve(searchUrl, ahref);
				console.log('zenchips', path)
				return path;
			});
		});
	}).then(function(destinations){
		console.log('inside hello')

		var links = toArray(destinations); //transforms array of promises to array of links
		var promiseArray = toPromise(links); //pushes links to an array of request promises		

		return Promise.all(promiseArray).then(function(arr){
			return arr.map(function(destination){
				var $ = cheerio.load(destination[0].body);
				// scraping dynamic data occurs
				var longitude = parseFloat($('.mapContainer').attr('data-lng'));
				var latitude = parseFloat($('.mapContainer').attr('data-lat'));
				var place = $('#HEADING').text().trim();
				// when using .map() on cheerio, call .get() at the end otherwise you'll end up with a cheerio collection, not a string array
				var categories = $('.separator .detail a').map(function(href){ return $(this).text()}).get().join(", ");
				return {place: place, categories: categories, coordinates: [latitude, longitude]}
			}).filter(function(info){
				return (!!info.coordinates[0] && !!info.coordinates[1])
			});
		});
	}).then(function(coords){
		console.log('coordinates for the win', coords)
		res.send(coords);
	})
});


var exclude = ['Tours', 'Services', 'Lessons', 'Classes'];

function check(text){
	for (var i = 0; i < exclude.length; i++){
		if (text.indexOf(exclude[i]) !== -1) return false;
	}
	return true;
}

function toArray(destinations){
	var arr = [];
	for (var i = 0; i < destinations.length; i++){
		arr.push(destinations[i])
	}
	return arr;
}

function toPromise(arr){
	var promiseArray = [];
	for(var i = 0; i < arr.length; i++){
		promiseArray.push(request(arr[i]))
	};
	return promiseArray;
}
module.exports = router;
