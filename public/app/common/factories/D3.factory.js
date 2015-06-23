var svg;
app.factory('D3Factory', function(){
	var polyLine
	var map;
	return {
		clearPlot: function(){
			console.log('IS IT CLEARING')
			if(svg){
				map.removeLayer(polyLine)
				svg.selectAll('circle').remove();	
			}
		},
		showPlots: function(dataSet){
			// initialized map
			if(map) map.setView(dataSet[0].coordinates, 8);
			else {	
				// doesn't
				map = L.map('map').setView(dataSet[0].coordinates, 8);
				var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
	       		L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	            	attribution: '&copy; ' + mapLink + ' Contributors',
	            	maxZoom: 18,
	            }).addTo(map);
	       	}

            // Initialize the SVG layer
			map._initPathRoot()    

			var test = dataSet.map(function(d){return d.coordinates});
			polyLine = L.polyline(test).addTo(map);

			// We pick up the SVG from the map object
			svg = d3.select("#map").select("svg");
			var g = svg.append("g");

            dataSet.forEach(function(d){
            	d.LatLng = new L.LatLng(d.coordinates[0], d.coordinates[1]);
            });

            var tooltip = d3.select("body").append("div")
   				.attr("class", "tooltip")
   				.style("opacity", 0);

            var feature = g.selectAll("circle")
				.data(dataSet)
				.enter().append("circle")
				.style("stroke", "black")   
				.style("fill", "red")
				.attr("r", 8)
				.on("mouseover", function(d) {
			        tooltip.transition()
			          .duration(200)
			          .style("opacity", .9);
			        tooltip.html('<h5>Step: '+d.step+'</h5><p>'+d.place + " - " + d.categories+'</p>')
			          .style("left", (d3.event.pageX + 5) + "px")
			          .attr("fill", '#215BB8')
		           .style("top", (d3.event.pageY - 28) + "px");
	     	    })
			    .on("mouseout", function(d) {
			        tooltip.transition()
			          .duration(500)
			          .style("opacity", 0);
			    }); 


			map.on("viewreset", update);
			update();

			function update() {
				feature.attr("transform", 
				function(d) { 
					return "translate("+ 
						map.latLngToLayerPoint(d.LatLng).x +","+ 
						map.latLngToLayerPoint(d.LatLng).y +")";
					}
				)
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
	}
})

