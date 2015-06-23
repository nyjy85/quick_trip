app.controller('HomeController', function($state, $scope, $anchorScroll, TSP, QueryFactory, D3Factory, $location) {
    $scope.requestDone = false;

  	$scope.sendQuery = function(query){
      $scope.requestDone = true;
  		$scope.loading = true;
  		QueryFactory.sendQuery(query).then(function(response){
  			console.log('back back back', response)
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

    $scope.getDirections = function(locations){
      // console.log('hit getDirections', locations)
      // var dataSet = locations.map(function(place){ return place.coordinates })
      var nn = TSP.nearestNeighbor(locations, locations[1].coordinates);
      D3Factory.clearPlot();
      $location.hash('map');
      $anchorScroll();
      D3Factory.showPlots(nn);
      // console.log('these is the output for shortest distance', nn)
    }
    
});