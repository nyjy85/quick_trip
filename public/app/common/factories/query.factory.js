app.factory('QueryFactory', function($http){
	return{
		sendQuery: function(string){
			var query = string.replace(/\s+/g, "+");
			console.log('query', query);
			var self = this;
			return $http.get('/api/home/'+ query).then(function(response){
				// self.places = response.data;
				console.log('this is places in sendQuery', self.places)
				return response.data;
			});
		},
		places: null,
		coordinates: function(){
			return this.places.map(function(place){return place.coordinates})
		}
	};
});

