app.factory('TSP', function(){
	return {
		nearestNeighbor: function(coordinates, start){
			console.log('this bee coordinates', coordinates, start);
			var count = 0;

			function NearestNeighbor(dataSet, startPoint){
				this.dataSet = dataSet; 
				this.startPoint = startPoint; 
				this.nearestK;
				this.output = [];
			}

			NearestNeighbor.prototype.sortByX = function(){
				this.dataSet.sort(function(a,b){ 
					return a.coordinates[0] - b.coordinates[0]
				}); 
				return this;
			};

			NearestNeighbor.prototype.getNearestK = function(k){
				this.nearestK = this.dataSet.slice(0,k); 
				return this;
			};


			NearestNeighbor.prototype.getNN = function(){
				var nearest = this.nextLocation();
				count++;
				nearest.step = count;
				this.output.push(nearest);
				this.startPoint = nearest.coordinates;
			};

			NearestNeighbor.prototype.nextLocation = function(){
				var sortedDistance = this.findDistance(this.nearestK);
				var idxOfNN = sortedDistance.shift().i; 

				return this.dataSet.splice(idxOfNN, 1)[0];
			};

			NearestNeighbor.prototype.findDistance = function(arr){
				var self = this;
				return arr.map(function(coo, idx){
					var obj = {};
					obj.i = idx;
					obj.coordinates = coo.coordinates;
					obj.distance = self.pythagorean(coo.coordinates[0], coo.coordinates[1]);
					return obj;	
				}).sort(function(a,b){ 
					return a.distance - b.distance; 
				});
			};

			NearestNeighbor.prototype.pythagorean = function(lat, longi){
				console.log('this.startPoint', this.startPoint)
				var startX = this.startPoint[0];
				var startY = this.startPoint[1];
				return Math.sqrt(Math.pow(startX - lat, 2) + Math.pow(startY - longi, 2));
			};

			var nn = new NearestNeighbor(coordinates, start);
			var len = coordinates.length;
			for(var i = 0; i < len; i++){
				nn.sortByX().getNearestK(3).getNN();
			}
			return nn.output;

		}
	}

})