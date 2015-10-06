'use strict';

var app = angular.module('Meaniscule', ['ui.router', 'ui.bootstrap']);

app.config(function ($urlRouterProvider, $locationProvider) {
   // This turns off hashbang urls (/#about) and changes it to something normal (/about)
   $locationProvider.html5Mode(true);
   // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
   $urlRouterProvider.otherwise('/');
});
'use strict';

app.controller('HomeController', function ($state, $scope, $anchorScroll, TSP, QueryFactory, D3Factory, $location) {
      $scope.requestDone = false;

      $scope.sendQuery = function (query) {
            $scope.requestDone = true;
            $scope.loading = true;
            QueryFactory.sendQuery(query).then(function (response) {
                  console.log('back back back', response);
                  $scope.loading = false;
                  $scope.places = response;
                  QueryFactory.places = response;
                  $scope.length = response.length;
                  $location.hash('coordinates');
                  $anchorScroll();
                  // console.log('first set a coo', response[0].coordinates)
                  D3Factory.clearPlot();
            });
      };

      $scope.getDirections = function (locations) {
            // console.log('hit getDirections', locations)
            // var dataSet = locations.map(function(place){ return place.coordinates })
            var nn = TSP.nearestNeighbor(locations, locations[1].coordinates);
            D3Factory.clearPlot();
            $location.hash('map');
            $anchorScroll();
            D3Factory.showPlots(nn);
            // console.log('these is the output for shortest distance', nn)
      };
});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: '/app/home/home.html',
        controller: 'HomeController'
    });
});
"use strict";

app.directive("navbar", function () {
	return {
		restrict: "E",
		templateUrl: "/app/navbar/navbar.html"
	};
});
"use strict";

function NearestNeighbor(dataSet, startPoint) {
	this.dataSet = dataSet;
	this.startPoint = startPoint;
	this.nearestK;
	this.output = [];
}

NearestNeighbor.prototype.sortByX = function () {
	this.dataSet.sort(function (a, b) {
		return a[0] - b[0];
	});
	return this;
};

NearestNeighbor.prototype.getNearestK = function (k) {
	this.nearestK = this.dataSet.slice(0, k);
	return this;
};

NearestNeighbor.prototype.getNN = function () {
	var nearest = this.nextLocation();
	this.output.push(nearest);
	this.startPoint = nearest;
};

NearestNeighbor.prototype.nextLocation = function () {
	var sortedDistance = this.findDistance(this.nearestK);
	var idxOfNN = sortedDistance.shift().i;
	return this.dataSet.splice(idxOfNN, 1)[0];
};

NearestNeighbor.prototype.findDistance = function (arr) {
	var self = this;
	return arr.map(function (coo, idx) {
		var obj = {};
		obj.i = idx;
		obj.coordinates = coo;
		obj.distance = self.pythagorean(coo[0], coo[1]);
		return obj;
	}).sort(function (a, b) {
		return a.distance - b.distance;
	});
};

NearestNeighbor.prototype.pythagorean = function (lat, longi) {
	var startX = this.startPoint[0];
	var startY = this.startPoint[1];
	return Math.sqrt(Math.pow(startX - lat, 2) + Math.pow(startY - longi, 2));
};
'use strict';

var svg;
app.factory('D3Factory', function () {
	var polyLine;
	var map;
	return {
		clearPlot: function clearPlot() {
			console.log('IS IT CLEARING');
			if (svg) {
				map.removeLayer(polyLine);
				svg.selectAll('circle').remove();
			}
		},
		showPlots: function showPlots(dataSet) {
			// initialized map
			if (map) map.setView(dataSet[0].coordinates, 8);else {
				// doesn't
				map = L.map('map').setView(dataSet[0].coordinates, 8);
				var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
				L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; ' + mapLink + ' Contributors',
					maxZoom: 18
				}).addTo(map);
			}

			// Initialize the SVG layer
			map._initPathRoot();

			var test = dataSet.map(function (d) {
				return d.coordinates;
			});
			polyLine = L.polyline(test).addTo(map);

			// We pick up the SVG from the map object
			svg = d3.select("#map").select("svg");
			var g = svg.append("g");

			dataSet.forEach(function (d) {
				d.LatLng = new L.LatLng(d.coordinates[0], d.coordinates[1]);
			});

			var tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

			var feature = g.selectAll("circle").data(dataSet).enter().append("circle").style("stroke", "black").style("fill", "red").attr("r", 8).on("mouseover", function (d) {
				tooltip.transition().duration(200).style("opacity", .9);
				tooltip.html('<h5>Step: ' + d.step + '</h5><p>' + d.place + " - " + d.categories + '</p>').style("left", d3.event.pageX + 5 + "px").attr("fill", '#215BB8').style("top", d3.event.pageY - 28 + "px");
			}).on("mouseout", function (d) {
				tooltip.transition().duration(500).style("opacity", 0);
			});

			map.on("viewreset", update);
			update();

			function update() {
				feature.attr("transform", function (d) {
					return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
				});
			}

			// var lat = dataSet.map(function(e){return e.coordinates[0]});
			// var long = dataSet.map(function(e){return e.coordinates[1]});
			// console.log('this be lat long arr', lat, long)

			// var xMax = Math.max.apply(null, lat); // height
			// var xMin = Math.min.apply(null, lat); // width
			// var yMax = Math.max.apply(null, long); // height
			// var yMin = Math.min.apply(null, long); // width

			// var w = 1800;
			// var h = 800;

			// // calculate max/min for x and y here if necessary
			// // var zoom = d3.behavior.zoom()
			// //  			.scaleExtent([1, 10])
			// //  			.on("zoom", zoomed);

			// var xScale = d3.scale.linear()
			//              .domain([xMin, xMax])
			//              .range([0,w]);

			// var yScale = d3.scale.linear()
			//              .domain([yMax, yMin])
			//              .range([0,h]);

			// svg = d3.select("#map")
			//     .append("svg")
			//     // .attr("width", w)
			//     // .attr("height",h)
			//     // .call(zoom)
			//     .append('svg:g')
			//     .attr('transform', 'translate(55,55)')
			//     .style("pointer-events", "all");

			// svg.selectAll("circle")
			//     .data(dataSet)
			//     .enter()
			//     .append("circle")
			//     .attr("cx", function(d) {
			//           return xScale(d.coordinates[0]);
			//     })
			//     .attr("cy", function(d) {
			//           return yScale(d.coordinates[1]);
			//     })
			//     .attr("r",4);

			// var xAxis = d3.svg.axis()
			//     .scale(xScale)
			//     .orient('bottom')
			//     .tickSize(1);

			// var yAxis = d3.svg.axis()
			//     .scale(yScale)
			//     .orient('left')
			//     .tickSize(1);

			// svg.selectAll('text')
			// 	.data(dataSet)
			// 	.enter()
			// 	.append('text')
			// 	.text(function(d){
			// 		return d.place + " - " + d.categories;
			// 	})
			// 	.attr("x", function(d) {
			// 	    return xScale(d.coordinates[0]);
			// 	})
			// 	.attr("y", function(d) {
			// 	   return yScale(d.coordinates[1]);
			// 	})
			// 	.attr("font-family", "sans-serif")
			// 				.attr("font-size", "11px")
			// 				.attr("fill", "red");

			// svg.append("svg:g")
			//     .attr("class", "xaxis")
			//     .attr("transform", "translate(0," + h + ")")
			//     .call(xAxis);

			// svg.append("svg:g")
			//     .attr("class", "yaxis")
			//     .call(yAxis);

			//    function zoomed() {
			// 	svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
			// };
		}
	};
});
'use strict';

app.factory('TSP', function () {
	return {
		nearestNeighbor: function nearestNeighbor(coordinates, start) {
			var count = 0;

			function NearestNeighbor(dataSet, startPoint) {
				this.dataSet = dataSet;
				this.startPoint = startPoint;
				this.nearestK;
				this.output = [];
			}

			NearestNeighbor.prototype.sortByX = function () {
				this.dataSet.sort(function (a, b) {
					return a.coordinates[0] - b.coordinates[0];
				});
				return this;
			};

			NearestNeighbor.prototype.getNearestK = function (k) {
				this.nearestK = this.dataSet.slice(0, k);
				return this;
			};

			NearestNeighbor.prototype.getNN = function () {
				var nearest = this.nextLocation();
				count++;
				nearest.step = count;
				this.output.push(nearest);
				this.startPoint = nearest.coordinates;
			};

			NearestNeighbor.prototype.nextLocation = function () {
				var sortedDistance = this.findDistance(this.nearestK);
				var idxOfNN = sortedDistance.shift().i;

				return this.dataSet.splice(idxOfNN, 1)[0];
			};

			NearestNeighbor.prototype.findDistance = function (arr) {
				var self = this;
				return arr.map(function (coo, idx) {
					var obj = {};
					obj.i = idx;
					obj.coordinates = coo.coordinates;
					obj.distance = self.pythagorean(coo.coordinates[0], coo.coordinates[1]);
					return obj;
				}).sort(function (a, b) {
					return a.distance - b.distance;
				});
			};

			NearestNeighbor.prototype.pythagorean = function (lat, longi) {
				var startX = this.startPoint[0];
				var startY = this.startPoint[1];
				return Math.sqrt(Math.pow(startX - lat, 2) + Math.pow(startY - longi, 2));
			};

			var nn = new NearestNeighbor(coordinates, start);
			var len = coordinates.length;

			for (var i = 0; i < len; i++) {
				nn.sortByX().getNearestK(3).getNN();
			}
			return nn.output;
		}
	};
});
'use strict';

app.factory('QueryFactory', function ($http) {
	return {
		sendQuery: function sendQuery(string) {
			var query = string.replace(/\s+/g, "+");
			console.log('query', query);
			var self = this;
			return $http.get('/api/home/' + query).then(function (response) {
				// self.places = response.data;
				console.log('this is places in sendQuery', self.places);
				return response.data;
			});
		},
		places: null,
		coordinates: function coordinates() {
			return this.places.map(function (place) {
				return place.coordinates;
			});
		}
	};
});
'use strict';

app.directive('loader', function ($compile) {
    return {
        restrict: 'E',
        template: '<img src="/app/common/directives/loader/plane2.gif" />'
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImhvbWUvaG9tZS5jb250cm9sbGVyLmpzIiwiaG9tZS9ob21lLnN0YXRlLmpzIiwibmF2YmFyL25hdmJhci5kaXJlY3RpdmUuanMiLCJjb21tb24vanMvbmVhcmVzdE5laWdoYm91ci5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRDMuZmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvbmVhcmVzdC5mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9xdWVyeS5mYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbG9hZGVyL2xvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7O0FBRXRFLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRTs7QUFFekQsb0JBQWlCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVsQyxxQkFBa0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDcEMsQ0FBQyxDQUFDOzs7QUNQSCxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQixFQUFFLFVBQVMsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFO0FBQzlHLFlBQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDOztBQUU1QixZQUFNLENBQUMsU0FBUyxHQUFHLFVBQVMsS0FBSyxFQUFDO0FBQy9CLGtCQUFNLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUM1QixrQkFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDdEIsd0JBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVMsUUFBUSxFQUFDO0FBQ3BELHlCQUFP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SSxDQUFDLFVBQVMsUUFBUSxFQUFDOztBQUU1RCxXQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUN2RCxXQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDckIsQ0FBQyxDQUFDO0dBQ0g7QUFDRCxRQUFNLEVBQUUsSUFBSTtBQUNaLGFBQVcsRUFBRSx1QkFBVTtBQUN0QixVQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVMsS0FBSyxFQUFDO0FBQUMsV0FBTyxLQUFLLENBQUMsV0FBVyxDQUFBO0lBQUMsQ0FBQyxDQUFBO0dBQ2pFO0VBQ0QsQ0FBQztDQUNGLENBQUMsQ0FBQzs7O0FDakJILEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFVBQVUsUUFBUSxFQUFFO0FBQ3hDLFdBQU87QUFDSCxnQkFBUSxFQUFFLEdBQUc7QUFDYixnQkFBUSxFQUFFLHdEQUF3RDtLQUNyRSxDQUFDO0NBQ0wsQ0FBQyxDQUFDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ01lYW5pc2N1bGUnLCBbJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgZnVuY3Rpb24oJHN0YXRlLCAkc2NvcGUsICRhbmNob3JTY3JvbGwsIFRTUCwgUXVlcnlGYWN0b3J5LCBEM0ZhY3RvcnksICRsb2NhdGlvbikge1xuICAgICRzY29wZS5yZXF1ZXN0RG9uZSA9IGZhbHNlO1xuXG4gIFx0JHNjb3BlLnNlbmRRdWVyeSA9IGZ1bmN0aW9uKHF1ZXJ5KXtcbiAgICAgICRzY29wZS5yZXF1ZXN0RG9uZSA9IHRydWU7XG4gIFx0XHQkc2NvcGUubG9hZGluZyA9IHRydWU7XG4gIFx0XHRRdWVyeUZhY3Rvcnkuc2VuZFF1ZXJ5KHF1ZXJ5KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgXHRcdFx0Y29uc29sZS5sb2coJ2JhY2sgYmFjayBiYWNrJywgcmVzcG9uc2UpXG4gIFx0XHRcdCRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG4gIFx0XHRcdCRzY29wZS5wbGFjZXMgPSByZXNwb25zZTtcbiAgICAgICAgUXVlcnlGYWN0b3J5LnBsYWNlcyA9IHJlc3BvbnNlO1xuICBcdFx0XHQkc2NvcGUubGVuZ3RoID0gcmVzcG9uc2UubGVuZ3RoO1xuICBcdFx0XHQkbG9jYXRpb24uaGFzaCgnY29vcmRpbmF0ZXMnKTtcbiAgICAgICAgJGFuY2hvclNjcm9sbCgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZmlyc3Qgc2V0IGEgY29vJywgcmVzcG9uc2VbMF0uY29vcmRpbmF0ZXMpXG4gIFx0XHRcdEQzRmFjdG9yeS5jbGVhclBsb3QoKTtcbiAgXHRcdH0pO1xuICBcdH07XG5cbiAgICAkc2NvcGUuZ2V0RGlyZWN0aW9ucyA9IGZ1bmN0aW9uKGxvY2F0aW9ucyl7XG4gICAgICAvLyBjb25zb2xlLmxvZygnaGl0IGdldERpcmVjdGlvbnMnLCBsb2NhdGlvbnMpXG4gICAgICAvLyB2YXIgZGF0YVNldCA9IGxvY2F0aW9ucy5tYXAoZnVuY3Rpb24ocGxhY2UpeyByZXR1cm4gcGxhY2UuY29vcmRpbmF0ZXMgfSlcbiAgICAgIHZhciBubiA9IFRTUC5uZWFyZXN0TmVpZ2hib3IobG9jYXRpb25zLCBsb2NhdGlvbnNbMV0uY29vcmRpbmF0ZXMpO1xuICAgICAgRDNGYWN0b3J5LmNsZWFyUGxvdCgpO1xuICAgICAgJGxvY2F0aW9uLmhhc2goJ21hcCcpO1xuICAgICAgJGFuY2hvclNjcm9sbCgpO1xuICAgICAgRDNGYWN0b3J5LnNob3dQbG90cyhubik7XG4gICAgICAvLyBjb25zb2xlLmxvZygndGhlc2UgaXMgdGhlIG91dHB1dCBmb3Igc2hvcnRlc3QgZGlzdGFuY2UnLCBubilcbiAgICB9XG4gICAgXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICcvYXBwL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJ1xuICAgIH0pO1xufSk7IiwiYXBwLmRpcmVjdGl2ZShcIm5hdmJhclwiLCBmdW5jdGlvbigpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiBcIkVcIixcblx0XHR0ZW1wbGF0ZVVybDogXCIvYXBwL25hdmJhci9uYXZiYXIuaHRtbFwiXG5cdH07XG59KTsiLCJmdW5jdGlvbiBOZWFyZXN0TmVpZ2hib3IoZGF0YVNldCwgc3RhcnRQb2ludCl7XG5cdHRoaXMuZGF0YVNldCA9IGRhdGFTZXQ7IFxuXHR0aGlzLnN0YXJ0UG9pbnQgPSBzdGFydFBvaW50OyBcblx0dGhpcy5uZWFyZXN0Sztcblx0dGhpcy5vdXRwdXQgPSBbXTtcbn1cblxuTmVhcmVzdE5laWdoYm9yLnByb3RvdHlwZS5zb3J0QnlYID0gZnVuY3Rpb24oKXtcblx0dGhpcy5kYXRhU2V0LnNvcnQoZnVuY3Rpb24oYSxiKXsgXG5cdFx0cmV0dXJuIGFbMF0gLSBiWzBdXG5cdH0pOyBcblx0cmV0dXJuIHRoaXM7XG59O1xuXG5OZWFyZXN0TmVpZ2hib3IucHJvdG90eXBlLmdldE5lYXJlc3RLID0gZnVuY3Rpb24oayl7XG5cdHRoaXMubmVhcmVzdEsgPSB0aGlzLmRhdGFTZXQuc2xpY2UoMCxrKTsgXG5cdHJldHVybiB0aGlzO1xufTtcblxuXG5OZWFyZXN0TmVpZ2hib3IucHJvdG90eXBlLmdldE5OID0gZnVuY3Rpb24oKXtcblx0dmFyIG5lYXJlc3QgPSB0aGlzLm5leHRMb2NhdGlvbigpO1xuXHR0aGlzLm91dHB1dC5wdXNoKG5lYXJlc3QpO1xuXHR0aGlzLnN0YXJ0UG9pbnQgPSBuZWFyZXN0O1xufTtcblxuTmVhcmVzdE5laWdoYm9yLnByb3RvdHlwZS5uZXh0TG9jYXRpb24gPSBmdW5jdGlvbigpe1xuXHR2YXIgc29ydGVkRGlzdGFuY2UgPSB0aGlzLmZpbmREaXN0YW5jZSh0aGlzLm5lYXJlc3RLKTtcblx0dmFyIGlkeE9mTk4gPSBzb3J0ZWREaXN0YW5jZS5zaGlmdCgpLmk7IFxuXHRyZXR1cm4gdGhpcy5kYXRhU2V0LnNwbGljZShpZHhPZk5OLCAxKVswXTtcbn07XG5cbk5lYXJlc3ROZWlnaGJvci5wcm90b3R5cGUuZmluZERpc3RhbmNlID0gZnVuY3Rpb24oYXJyKXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRyZXR1cm4gYXJyLm1hcChmdW5jdGlvbihjb28sIGlkeCl7XG5cdFx0dmFyIG9iaiA9IHt9O1xuXHRcdG9iai5pID0gaWR4O1xuXHRcdG9iai5jb29yZGluYXRlcyA9IGNvbztcblx0XHRvYmouZGlzdGFuY2UgPSBzZWxmLnB5dGhhZ29yZWFuKGNvb1swXSwgY29vWzFdKTtcblx0XHRyZXR1cm4gb2JqO1x0XG5cdH0pLnNvcnQoZnVuY3Rpb24oYSxiKXsgXG5cdFx0cmV0dXJuIGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlOyBcblx0fSk7XG59O1xuXG5OZWFyZXN0TmVpZ2hib3IucHJvdG90eXBlLnB5dGhhZ29yZWFuID0gZnVuY3Rpb24obGF0LCBsb25naSl7XG5cdHZhciBzdGFydFggPSB0aGlzLnN0YXJ0UG9pbnRbMF07XG5cdHZhciBzdGFydFkgPSB0aGlzLnN0YXJ0UG9pbnRbMV07XG5cdHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3coc3RhcnRYIC0gbGF0LCAyKSArIE1hdGgucG93KHN0YXJ0WSAtIGxvbmdpLCAyKSk7XG59O1xuIiwidmFyIHN2ZztcbmFwcC5mYWN0b3J5KCdEM0ZhY3RvcnknLCBmdW5jdGlvbigpe1xuXHR2YXIgcG9seUxpbmVcblx0dmFyIG1hcDtcblx0cmV0dXJuIHtcblx0XHRjbGVhclBsb3Q6IGZ1bmN0aW9uKCl7XG5cdFx0XHRjb25zb2xlLmxvZygnSVMgSVQgQ0xFQVJJTkcnKVxuXHRcdFx0aWYoc3ZnKXtcblx0XHRcdFx0bWFwLnJlbW92ZUxheWVyKHBvbHlMaW5lKVxuXHRcdFx0XHRzdmcuc2VsZWN0QWxsKCdjaXJjbGUnKS5yZW1vdmUoKTtcdFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0c2hvd1Bsb3RzOiBmdW5jdGlvbihkYXRhU2V0KXtcblx0XHRcdC8vIGluaXRpYWxpemVkIG1hcFxuXHRcdFx0aWYobWFwKSBtYXAuc2V0VmlldyhkYXRhU2V0WzBdLmNvb3JkaW5hdGVzLCA4KTtcblx0XHRcdGVsc2Uge1x0XG5cdFx0XHRcdC8vIGRvZXNuJ3Rcblx0XHRcdFx0bWFwID0gTC5tYXAoJ21hcCcpLnNldFZpZXcoZGF0YVNldFswXS5jb29yZGluYXRlcywgOCk7XG5cdFx0XHRcdHZhciBtYXBMaW5rID0gJzxhIGhyZWY9XCJodHRwOi8vb3BlbnN0cmVldG1hcC5vcmdcIj5PcGVuU3RyZWV0TWFwPC9hPic7XG5cdCAgICAgICBcdFx0TC50aWxlTGF5ZXIoJ2h0dHA6Ly97c30udGlsZS5vcGVuc3RyZWV0bWFwLm9yZy97en0ve3h9L3t5fS5wbmcnLCB7XG5cdCAgICAgICAgICAgIFx0YXR0cmlidXRpb246ICcmY29weTsgJyArIG1hcExpbmsgKyAnIENvbnRyaWJ1dG9ycycsXG5cdCAgICAgICAgICAgIFx0bWF4Wm9vbTogMTgsXG5cdCAgICAgICAgICAgIH0pLmFkZFRvKG1hcCk7XG5cdCAgICAgICBcdH1cblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgU1ZHIGxheWVyXG5cdFx0XHRtYXAuX2luaXRQYXRoUm9vdCgpICAgIFxuXG5cdFx0XHR2YXIgdGVzdCA9IGRhdGFTZXQubWFwKGZ1bmN0aW9uKGQpe3JldHVybiBkLmNvb3JkaW5hdGVzfSk7XG5cdFx0XHRwb2x5TGluZSA9IEwucG9seWxpbmUodGVzdCkuYWRkVG8obWFwKTtcblxuXHRcdFx0Ly8gV2UgcGljayB1cCB0aGUgU1ZHIGZyb20gdGhlIG1hcCBvYmplY3Rcblx0XHRcdHN2ZyA9IGQzLnNlbGVjdChcIiNtYXBcIikuc2VsZWN0KFwic3ZnXCIpO1xuXHRcdFx0dmFyIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcblxuICAgICAgICAgICAgZGF0YVNldC5mb3JFYWNoKGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgXHRkLkxhdExuZyA9IG5ldyBMLkxhdExuZyhkLmNvb3JkaW5hdGVzWzBdLCBkLmNvb3JkaW5hdGVzWzFdKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgdG9vbHRpcCA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwiZGl2XCIpXG4gICBcdFx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ0b29sdGlwXCIpXG4gICBcdFx0XHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cbiAgICAgICAgICAgIHZhciBmZWF0dXJlID0gZy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcblx0XHRcdFx0LmRhdGEoZGF0YVNldClcblx0XHRcdFx0LmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdFx0XHRcdC5zdHlsZShcInN0cm9rZVwiLCBcImJsYWNrXCIpICAgXG5cdFx0XHRcdC5zdHlsZShcImZpbGxcIiwgXCJyZWRcIilcblx0XHRcdFx0LmF0dHIoXCJyXCIsIDgpXG5cdFx0XHRcdC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkKSB7XG5cdFx0XHQgICAgICAgIHRvb2x0aXAudHJhbnNpdGlvbigpXG5cdFx0XHQgICAgICAgICAgLmR1cmF0aW9uKDIwMClcblx0XHRcdCAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIC45KTtcblx0XHRcdCAgICAgICAgdG9vbHRpcC5odG1sKCc8aDU+U3RlcDogJytkLnN0ZXArJzwvaDU+PHA+JytkLnBsYWNlICsgXCIgLSBcIiArIGQuY2F0ZWdvcmllcysnPC9wPicpXG5cdFx0XHQgICAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZDMuZXZlbnQucGFnZVggKyA1KSArIFwicHhcIilcblx0XHRcdCAgICAgICAgICAuYXR0cihcImZpbGxcIiwgJyMyMTVCQjgnKVxuXHRcdCAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIChkMy5ldmVudC5wYWdlWSAtIDI4KSArIFwicHhcIik7XG5cdCAgICAgXHQgICAgfSlcblx0XHRcdCAgICAub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkKSB7XG5cdFx0XHQgICAgICAgIHRvb2x0aXAudHJhbnNpdGlvbigpXG5cdFx0XHQgICAgICAgICAgLmR1cmF0aW9uKDUwMClcblx0XHRcdCAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdFx0ICAgIH0pOyBcblxuXG5cdFx0XHRtYXAub24oXCJ2aWV3cmVzZXRcIiwgdXBkYXRlKTtcblx0XHRcdHVwZGF0ZSgpO1xuXG5cdFx0XHRmdW5jdGlvbiB1cGRhdGUoKSB7XG5cdFx0XHRcdGZlYXR1cmUuYXR0cihcInRyYW5zZm9ybVwiLCBcblx0XHRcdFx0ZnVuY3Rpb24oZCkgeyBcblx0XHRcdFx0XHRyZXR1cm4gXCJ0cmFuc2xhdGUoXCIrIFxuXHRcdFx0XHRcdFx0bWFwLmxhdExuZ1RvTGF5ZXJQb2ludChkLkxhdExuZykueCArXCIsXCIrIFxuXHRcdFx0XHRcdFx0bWFwLmxhdExuZ1RvTGF5ZXJQb2ludChkLkxhdExuZykueSArXCIpXCI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQpXG5cdFx0XHR9IFxuXG5cdFx0XHRcblxuXHRcdFx0Ly8gdmFyIGxhdCA9IGRhdGFTZXQubWFwKGZ1bmN0aW9uKGUpe3JldHVybiBlLmNvb3JkaW5hdGVzWzBdfSk7XG5cdFx0XHQvLyB2YXIgbG9uZyA9IGRhdGFTZXQubWFwKGZ1bmN0aW9uKGUpe3JldHVybiBlLmNvb3JkaW5hdGVzWzFdfSk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygndGhpcyBiZSBsYXQgbG9uZyBhcnInLCBsYXQsIGxvbmcpXG5cblx0XHRcdC8vIHZhciB4TWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgbGF0KTsgLy8gaGVpZ2h0XG5cdFx0XHQvLyB2YXIgeE1pbiA9IE1hdGgubWluLmFwcGx5KG51bGwsIGxhdCk7IC8vIHdpZHRoXG5cdFx0XHQvLyB2YXIgeU1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGxvbmcpOyAvLyBoZWlnaHRcblx0XHRcdC8vIHZhciB5TWluID0gTWF0aC5taW4uYXBwbHkobnVsbCwgbG9uZyk7IC8vIHdpZHRoXG5cblx0XHRcdC8vIHZhciB3ID0gMTgwMDtcblx0XHRcdC8vIHZhciBoID0gODAwO1xuXG5cdFx0XHQvLyAvLyBjYWxjdWxhdGUgbWF4L21pbiBmb3IgeCBhbmQgeSBoZXJlIGlmIG5lY2Vzc2FyeVxuXHRcdFx0Ly8gLy8gdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgIC8vIC8vICBcdFx0XHQuc2NhbGVFeHRlbnQoWzEsIDEwXSlcbiAgIC8vIC8vICBcdFx0XHQub24oXCJ6b29tXCIsIHpvb21lZCk7XG5cblx0XHRcdC8vIHZhciB4U2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuXHRcdFx0Ly8gICAgICAgICAgICAgIC5kb21haW4oW3hNaW4sIHhNYXhdKSBcblx0XHRcdC8vICAgICAgICAgICAgICAucmFuZ2UoWzAsd10pO1xuXG5cdFx0XHQvLyB2YXIgeVNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcblx0XHRcdC8vICAgICAgICAgICAgICAuZG9tYWluKFt5TWF4LCB5TWluXSlcblx0XHRcdC8vICAgICAgICAgICAgICAucmFuZ2UoWzAsaF0pO1xuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHQvLyBzdmcgPSBkMy5zZWxlY3QoXCIjbWFwXCIpXG5cdFx0XHQvLyAgICAgLmFwcGVuZChcInN2Z1wiKVxuXHRcdFx0Ly8gICAgIC8vIC5hdHRyKFwid2lkdGhcIiwgdylcblx0XHRcdC8vICAgICAvLyAuYXR0cihcImhlaWdodFwiLGgpXG5cdFx0XHQvLyAgICAgLy8gLmNhbGwoem9vbSlcblx0XHRcdC8vICAgICAuYXBwZW5kKCdzdmc6ZycpXG5cdFx0XHQvLyAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoNTUsNTUpJylcblx0XHRcdC8vICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcImFsbFwiKTtcblxuXHRcdFx0Ly8gc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuXHRcdFx0Ly8gICAgIC5kYXRhKGRhdGFTZXQpXG5cdFx0XHQvLyAgICAgLmVudGVyKClcblx0XHRcdC8vICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdFx0XHQvLyAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7XG5cdFx0XHQvLyAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkLmNvb3JkaW5hdGVzWzBdKTsgXG5cdFx0XHQvLyAgICAgfSlcblx0XHRcdC8vICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHtcblx0XHRcdC8vICAgICAgICAgICByZXR1cm4geVNjYWxlKGQuY29vcmRpbmF0ZXNbMV0pOyBcblx0XHRcdC8vICAgICB9KVxuXHRcdFx0Ly8gICAgIC5hdHRyKFwiclwiLDQpOyBcblxuXG5cdFx0XHQvLyB2YXIgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG5cdFx0XHQvLyAgICAgLnNjYWxlKHhTY2FsZSlcblx0XHRcdC8vICAgICAub3JpZW50KCdib3R0b20nKVxuXHRcdFx0Ly8gICAgIC50aWNrU2l6ZSgxKTtcblxuXHRcdFx0Ly8gdmFyIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuXHRcdFx0Ly8gICAgIC5zY2FsZSh5U2NhbGUpXG5cdFx0XHQvLyAgICAgLm9yaWVudCgnbGVmdCcpXG5cdFx0XHQvLyAgICAgLnRpY2tTaXplKDEpO1xuXG5cdFx0XHQvLyBzdmcuc2VsZWN0QWxsKCd0ZXh0Jylcblx0XHRcdC8vIFx0LmRhdGEoZGF0YVNldClcblx0XHRcdC8vIFx0LmVudGVyKClcblx0XHRcdC8vIFx0LmFwcGVuZCgndGV4dCcpXG5cdFx0XHQvLyBcdC50ZXh0KGZ1bmN0aW9uKGQpe1xuXHRcdFx0Ly8gXHRcdHJldHVybiBkLnBsYWNlICsgXCIgLSBcIiArIGQuY2F0ZWdvcmllcztcblx0XHRcdC8vIFx0fSlcblx0XHRcdC8vIFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcblx0XHRcdC8vIFx0ICAgIHJldHVybiB4U2NhbGUoZC5jb29yZGluYXRlc1swXSk7XG5cdFx0XHQvLyBcdH0pXG5cdFx0XHQvLyBcdC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7XG5cdFx0XHQvLyBcdCAgIHJldHVybiB5U2NhbGUoZC5jb29yZGluYXRlc1sxXSk7XG5cdFx0XHQvLyBcdH0pXG5cdFx0XHQvLyBcdC5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpXG4gICAvLyBcdFx0XHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIFwiMTFweFwiKVxuICAgLy8gXHRcdFx0XHQuYXR0cihcImZpbGxcIiwgXCJyZWRcIik7XG4gICBcdFx0XHRcblxuXHRcdFx0Ly8gc3ZnLmFwcGVuZChcInN2ZzpnXCIpXG5cdFx0XHQvLyAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInhheGlzXCIpXG5cdFx0XHQvLyAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGggKyBcIilcIilcblx0XHRcdC8vICAgICAuY2FsbCh4QXhpcyk7XG5cblx0XHRcdC8vIHN2Zy5hcHBlbmQoXCJzdmc6Z1wiKVxuXHRcdFx0Ly8gICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5YXhpc1wiKVxuXHRcdFx0Ly8gICAgIC5jYWxsKHlBeGlzKTtcblxuXHRcdCAvLyAgICBmdW5jdGlvbiB6b29tZWQoKSB7XG5cdFx0XHQvLyBcdHN2Zy5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcblx0XHRcdC8vIH07XG5cblx0XHR9XG5cdH1cbn0pXG5cbiIsImFwcC5mYWN0b3J5KCdUU1AnLCBmdW5jdGlvbigpe1xuXHRyZXR1cm4ge1xuXHRcdG5lYXJlc3ROZWlnaGJvcjogZnVuY3Rpb24oY29vcmRpbmF0ZXMsIHN0YXJ0KXtcblx0XHRcdHZhciBjb3VudCA9IDA7XG5cblx0XHRcdGZ1bmN0aW9uIE5lYXJlc3ROZWlnaGJvcihkYXRhU2V0LCBzdGFydFBvaW50KXtcblx0XHRcdFx0dGhpcy5kYXRhU2V0ID0gZGF0YVNldDsgXG5cdFx0XHRcdHRoaXMuc3RhcnRQb2ludCA9IHN0YXJ0UG9pbnQ7IFxuXHRcdFx0XHR0aGlzLm5lYXJlc3RLO1xuXHRcdFx0XHR0aGlzLm91dHB1dCA9IFtdO1xuXHRcdFx0fVxuXG5cdFx0XHROZWFyZXN0TmVpZ2hib3IucHJvdG90eXBlLnNvcnRCeVggPSBmdW5jdGlvbigpe1xuXHRcdFx0XHR0aGlzLmRhdGFTZXQuc29ydChmdW5jdGlvbihhLGIpeyBcblx0XHRcdFx0XHRyZXR1cm4gYS5jb29yZGluYXRlc1swXSAtIGIuY29vcmRpbmF0ZXNbMF1cblx0XHRcdFx0fSk7IFxuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH07XG5cblx0XHRcdE5lYXJlc3ROZWlnaGJvci5wcm90b3R5cGUuZ2V0TmVhcmVzdEsgPSBmdW5jdGlvbihrKXtcblx0XHRcdFx0dGhpcy5uZWFyZXN0SyA9IHRoaXMuZGF0YVNldC5zbGljZSgwLGspOyBcblx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHR9O1xuXG5cblx0XHRcdE5lYXJlc3ROZWlnaGJvci5wcm90b3R5cGUuZ2V0Tk4gPSBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgbmVhcmVzdCA9IHRoaXMubmV4dExvY2F0aW9uKCk7XG5cdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdG5lYXJlc3Quc3RlcCA9IGNvdW50O1xuXHRcdFx0XHR0aGlzLm91dHB1dC5wdXNoKG5lYXJlc3QpO1xuXHRcdFx0XHR0aGlzLnN0YXJ0UG9pbnQgPSBuZWFyZXN0LmNvb3JkaW5hdGVzO1xuXHRcdFx0fTtcblxuXHRcdFx0TmVhcmVzdE5laWdoYm9yLnByb3RvdHlwZS5uZXh0TG9jYXRpb24gPSBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgc29ydGVkRGlzdGFuY2UgPSB0aGlzLmZpbmREaXN0YW5jZSh0aGlzLm5lYXJlc3RLKTtcblx0XHRcdFx0dmFyIGlkeE9mTk4gPSBzb3J0ZWREaXN0YW5jZS5zaGlmdCgpLmk7IFxuXG5cdFx0XHRcdHJldHVybiB0aGlzLmRhdGFTZXQuc3BsaWNlKGlkeE9mTk4sIDEpWzBdO1xuXHRcdFx0fTtcblxuXHRcdFx0TmVhcmVzdE5laWdoYm9yLnByb3RvdHlwZS5maW5kRGlzdGFuY2UgPSBmdW5jdGlvbihhcnIpe1xuXHRcdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRcdHJldHVybiBhcnIubWFwKGZ1bmN0aW9uKGNvbywgaWR4KXtcblx0XHRcdFx0XHR2YXIgb2JqID0ge307XG5cdFx0XHRcdFx0b2JqLmkgPSBpZHg7XG5cdFx0XHRcdFx0b2JqLmNvb3JkaW5hdGVzID0gY29vLmNvb3JkaW5hdGVzO1xuXHRcdFx0XHRcdG9iai5kaXN0YW5jZSA9IHNlbGYucHl0aGFnb3JlYW4oY29vLmNvb3JkaW5hdGVzWzBdLCBjb28uY29vcmRpbmF0ZXNbMV0pO1xuXHRcdFx0XHRcdHJldHVybiBvYmo7XHRcblx0XHRcdFx0fSkuc29ydChmdW5jdGlvbihhLGIpeyBcblx0XHRcdFx0XHRyZXR1cm4gYS5kaXN0YW5jZSAtIGIuZGlzdGFuY2U7IFxuXHRcdFx0XHR9KTtcblx0XHRcdH07XG5cblx0XHRcdE5lYXJlc3ROZWlnaGJvci5wcm90b3R5cGUucHl0aGFnb3JlYW4gPSBmdW5jdGlvbihsYXQsIGxvbmdpKXtcblx0XHRcdFx0dmFyIHN0YXJ0WCA9IHRoaXMuc3RhcnRQb2ludFswXTtcblx0XHRcdFx0dmFyIHN0YXJ0WSA9IHRoaXMuc3RhcnRQb2ludFsxXTtcblx0XHRcdFx0cmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhzdGFydFggLSBsYXQsIDIpICsgTWF0aC5wb3coc3RhcnRZIC0gbG9uZ2ksIDIpKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBubiA9IG5ldyBOZWFyZXN0TmVpZ2hib3IoY29vcmRpbmF0ZXMsIHN0YXJ0KTtcblx0XHRcdHZhciBsZW4gPSBjb29yZGluYXRlcy5sZW5ndGg7XG5cdFx0XHRcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG5cdFx0XHRcdG5uLnNvcnRCeVgoKS5nZXROZWFyZXN0SygzKS5nZXROTigpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5uLm91dHB1dDtcblxuXHRcdH1cblx0fVxuXG59KSIsImFwcC5mYWN0b3J5KCdRdWVyeUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XG5cdHJldHVybntcblx0XHRzZW5kUXVlcnk6IGZ1bmN0aW9uKHN0cmluZyl7XG5cdFx0XHR2YXIgcXVlcnkgPSBzdHJpbmcucmVwbGFjZSgvXFxzKy9nLCBcIitcIik7XG5cdFx0XHRjb25zb2xlLmxvZygncXVlcnknLCBxdWVyeSk7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2hvbWUvJysgcXVlcnkpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHQvLyBzZWxmLnBsYWNlcyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCd0aGlzIGlzIHBsYWNlcyBpbiBzZW5kUXVlcnknLCBzZWxmLnBsYWNlcylcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdHBsYWNlczogbnVsbCxcblx0XHRjb29yZGluYXRlczogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB0aGlzLnBsYWNlcy5tYXAoZnVuY3Rpb24ocGxhY2Upe3JldHVybiBwbGFjZS5jb29yZGluYXRlc30pXG5cdFx0fVxuXHR9O1xufSk7XG5cbiIsImFwcC5kaXJlY3RpdmUoJ2xvYWRlcicsIGZ1bmN0aW9uICgkY29tcGlsZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBzcmM9XCIvYXBwL2NvbW1vbi9kaXJlY3RpdmVzL2xvYWRlci9wbGFuZTIuZ2lmXCIgLz4nXG4gICAgfTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
