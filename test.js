var PF = require('pathfinding')

// https://maps.googleapis.com/maps/api/directions/json?
	// 	origin=Adelaide,SA&   - pass in coordinates seperated by , but with no spaces
	//  destination=Adelaide,SA&
	//  waypoints=optimize:true|Barossa+Valley,SA|Clare,SA|Connawarra,SA|McLaren+Vale,SA&
	//  key=AIzaSyCxRNR_ENlt2OFZbUKzT-BZUgIxbTLgK0Q

var permArr = [],
  usedChars = [];

function permute(input) {
  var i, ch;
  for (i = 0; i < input.length; i++) {
    ch = input.splice(i, 1)[0];
    usedChars.push(ch);
    if (input.length == 0) {
      permArr.push(usedChars.slice());
    }
    permute(input);
    input.splice(i, 0, ch);
    usedChars.pop();
  }
  return permArr
};

var dataSet = [[25.61381,-80.47052],[25.781338,-80.18815],[25.744387,-80.21047],[25.80114,-80.19932],[25.777224,-80.18987],[25.656536,-80.423904],[25.6105,-80.397835],[25.777973,-80.21929],[25.787592,-80.3806],[25.804243,-80.19892],[25.798426,-80.198784],[25.785774,-80.18617],[25.780704,-80.13071],[25.767126,-80.190216],[25.77819,-80.18688],[25.77421,-80.19051],[25.710205,-80.39181],[25.9203,-80.14007],[25.77514,-80.187035],[25.796392,-80.331856]];
var simpleData = [[3,5],[4,2], [7,11], [11,3], [0,4]];
var startingPoint = [0,0]
// nearest neighbor algorithm
function nearestNeighbor(k){
	var output = [];
	var sortedX = simpleData.sort(function(a,b){ 
		return a[0] - b[0]
	}).map(function(location, idx){
		var obj = {};
		obj[idx] = location;
		return obj
	}); //[{0: [0,4]}, {1: [3,5]}, {2: [4,2]}, {3: [7,11]}, {4: [11,3]}]
	var nearestK = sortedX.slice(0,k);
	// apply pythagorean theorom from starting point to nearest K points
	var sortedDistance = findDistance(nearestK); // [{0: [0,4], distance: 4}, {2: [4,2], distance: 4.47213595499958}, {1: [3,5], distance: 5.830951894845301}]	
	var sortedDistanceIdx = Object.keys(sortedDistance.shift())[0]
	console.log(sortedDistanceIdx)
	output.push(simpleData.slice(sortedDistanceIdx, sortedDistanceIdx+1)[0])
	return output;
}


function findDistance(arr){ //[{0:[0,4]}, {1:[3,5]}, {2:[4,2]}]
	return arr.map(function(coo, idx){
		coo.distance = pythagorean(coo[idx][0], coo[idx][1])
		return coo;	
	}).sort(function(a,b){
		return a.distance - b.distance
	}); // [{0: [0,4], distance: 4}, {1: [3,5], distance: 5.830951894845301}, {2: [4,2], distance: 4.47213595499958}]

};

function pythagorean(lat, longi){
	var startX = startingPoint[0];
	var startY = startingPoint[1];
	return Math.sqrt(Math.pow(startX - lat, 2) + Math.pow(startY - longi, 2));
};


	// sort coordinates by x-axis
// sort the distances from shortest to longest
// OOP
var simpleData = [[3,5],[1,1],[4,2], [-1,5],[7,11], [11,3], [0,4]];
function NearestNeighbor(dataSet, startPoint){
	this.dataSet = dataSet; 
	this.startPoint = startPoint; 
	this.nearestK;
	this.output = [];
}

// sorts the data set
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
}

NearestNeighbor.prototype.findDistance = function(arr){
	var self = this;
	console.log('this is arr in findDistance', arr)
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

var nn = new NearestNeighbor(simpleData, [0,0]);
var len = simpleData.length;
for (var i = 0; i < len; i++){
	nn.sortByX().getNearestK(3).getNN();
}



