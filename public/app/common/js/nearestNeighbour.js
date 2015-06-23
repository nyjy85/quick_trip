function NearestNeighbor(dataSet, startPoint){
	this.dataSet = dataSet; 
	this.startPoint = startPoint; 
	this.nearestK;
	this.output = [];
}

NearestNeighbor.prototype.sortByX = function(){
	this.dataSet.sort(function(a,b){ 
		return a[0] - b[0]
	}); 
	return this;
};

NearestNeighbor.prototype.getNearestK = function(k){
	this.nearestK = this.dataSet.slice(0,k); 
	return this;
};


NearestNeighbor.prototype.getNN = function(){
	var nearest = this.nextLocation();
	this.output.push(nearest);
	this.startPoint = nearest;
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
		obj.coordinates = coo;
		obj.distance = self.pythagorean(coo[0], coo[1]);
		return obj;	
	}).sort(function(a,b){ 
		return a.distance - b.distance; 
	});
};

NearestNeighbor.prototype.pythagorean = function(lat, longi){
	var startX = this.startPoint[0];
	var startY = this.startPoint[1];
	return Math.sqrt(Math.pow(startX - lat, 2) + Math.pow(startY - longi, 2));
};
