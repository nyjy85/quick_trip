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


		// return Promise.map(arr, function(dest){
		// 	phantom.create(function (ph) {
		// 		ph.createPage(function (page) {
		// 		    page.open(dest, function (status) {
		// 		    	console.log("opened page? ", status);
		// 		     	page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
		// 		      		page.evaluate(function () { return [$('.mapContainer').attr('data-lng'), $('.mapContainer').attr('data-lat')] }, function (result) {
		// 		        		console.log('coordinates are ' + result);
		// 		        		ph.exit(result);
		// 		        	});
		// 		        });
		// 		    });
		// 		});
		// 	});
		// }, function(err, results){
		// 	console.log('results from ASYNC map', results)
		// 	return results
		// })
		// return destinations.map(function(idx, dest){

		// 	phantom.create(function (ph) {
		// 		ph.createPage(function (page) {
		// 		    page.open(dest, function (status) {
		// 		    	console.log("opened page? ", status);
		// 		     	page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
		// 		      		page.evaluate(function () { return [$('.mapContainer').attr('data-lng'), $('.mapContainer').attr('data-lat')] }, function (result) {
		// 		        		console.log('coordinates are ' + result);
		// 		        		ph.exit(result);
		// 		        	});
		// 		        });
		// 		    });
		// 		});
		// 	});
		// });
			// return request(dest).then(function(page){
			// 	var $ = cheerio.load(page[0].body);
			// 	// console.log('phone', page[0].body)
			// 	// now let's grab the coordinates
			// 	// need to wait until the map loads
			// 	var longitude = $('.mapContainer').attr('data-lng');
			// 	var latitude = $('.mapContainer').attr('data-lat');
			// 	console.log('coop', [longitude, latitude])
			// 	var coordinates = [longitude, latitude];
			// 	return coordinates;

// phantom.create(function (ph) {
//   ph.createPage(function (page) {
//     page.open("http://www.tripadvisor.com/Attraction_Review-g147312-d1997485-Reviews-Blue_Hole-Ocho_Rios_Saint_Ann_Parish_Jamaica.html", function (status) {
//       console.log("opened page? ", status);
//       page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
//       	page.evaluate(function () { return [$('.mapContainer').attr('data-lng'), $('.mapContainer').attr('data-lat')] }, function (result) {
//         	console.log('coordinates are ' + result);
//         	arr.push(result);
//         	ph.exit();
//         });
//       });
//     });
//   });
// });

// <img alt="" width="100%" id="lazyload_-476346663_2" height="225" 
// src="//maps.google.com/maps/api/staticmap?channel=ta.desktop&amp;center=18.371031,-77.051506&amp;zoom=15&amp;maptype=roadmap&amp;size=340x225&amp;client=gme-tripadvisorinc1&amp;sensor=false&amp;markers=icon:http%3A%2F%2Fc1.tacdn.com%2Fimg2%2Fmaps%2Ficons%2Fpin_v2_CurrentCenter.png|18.37103,-77.051506&amp;language=en_US&amp;signature=JB2BFBRlp2u33p9OoeA6ZLvvKt4=">
// var mapSrc = $('#STATIC_MAP img').attr('src');
// var coordinates = mapSrc.match(/\|(.*)\&/).pop();
// var arrCoo = coordinates.split(",");
// arrCoo = arrCoo.map(function(num){ parseFloat(num) });

// var phantom = require('phantom');

// phantom.create(function (ph) {
//   ph.createPage(function (page) {
//     page.open("http://www.tripadvisor.com/Attraction_Review-g147312-d1997485-Reviews-Blue_Hole-Ocho_Rios_Saint_Ann_Parish_Jamaica.html", function (status) {
//       console.log("opened google? ", status);
//       page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
//       	page.evaluate(function () { return $('.mapContainer').attr('data-lng') }, function (result) {
//         	console.log('Page title is ' + result);
//         	ph.exit();
//         });
//       });
//     });
//   });
// });

	// return phantom.create(function (ph) {
		// 	  ph.createPage(function (page) {
		// 	  	console.log('this be page', site)
		// 	    page.open(site, function (status) {
		// 	      console.log("opened page? ", status);
		// 	      page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
		// 	      	page.evaluate(function () { return [$('.mapContainer').attr('data-lng'), $('.mapContainer').attr('data-lat')] }, function (result) {
		// 	        	console.log('coordinates are ' + result);
		// 	        	arrayOfCoordinates.push(result);
		// 	        	ph.exit();
		// 	        });
		// 	      });
		// 	    });
		// 	  });
		// 	});
		// return arr.map(function(dest){
		// return phantom.create()
		// .bind({})
		// .then(function(ph){
		// 	this.ph = ph;
		// 	return ph.createPage()
		// }).then(function(page){
		// 	this.page = page; 
		// 	return page.open(site);
		// }).then(function(status){
		// 	console.log('site opened?', status)
		// 	console.log('__dirname', __dirname)
		// 	return this.page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js");
		// })
		// .delay(5000)
		// .then(function(){
		// 	console.log('this.page', this.page)
		// 	return this.page.evaluate(function(){
		// 		console.log('$map.container', $('.mapContainer'));
		// 		return [$('.mapContainer').attr('data-lng'), $('.mapContainer').attr('data-lat')]
		// 	})
		// }).then(function(result){
		// 	console.log('coordinates are ', result)
		// 	// return ph.exit(result)
		// }).finally(function(){
		// 	return this.ph.exit();
		// }).finally(function(){
		// 	process.exit();
		// });
		// })

