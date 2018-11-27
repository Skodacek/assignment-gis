$(document).ready(function() {

	let yourLat = 0, yourLong = 0;
	let mymap = L.map('map')
	let popup = L.popup();

	let studioTileLayer = L.tileLayer(
		'https://api.mapbox.com/styles/v1/skodko/cjn0k9qlz4huk2rse71zt319l/tiles/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic2tvZGtvIiwiYSI6ImNqbXFzemhrczFlNWgzcHFjdTFiZDNpYTMifQ.Ea7G79-WcLwk-F6vfKRYuw', {
			maxZoom: 20,
			tileSize: 512,
			zoomOffset: -1,
			attribution: ''
		}).addTo(mymap);
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(function(position) {
			
			yourLat = position.coords.latitude
			yourLong =  position.coords.longitude

			mymap.setView([yourLat, yourLong], 14)

			circle = L.circle([yourLat, yourLong], 1000, {
				color: '#fff',
				fillColor: '#fff',
				fillOpacity: 0.05
			}).addTo(mymap);

			upCentroid = L.circle([yourLat, yourLong], 5, {
				color: '#fff',
				fillColor: '#fff',
				fillOpacity: 1
			}).addTo(mymap);

			circle.on({
				mousedown: function () {
					mymap.dragging.disable();
					mymap.on('mousemove', function (e) {
						circle.setLatLng(e.latlng);
						upCentroid.setLatLng(e.latlng);
					});
				}
			}); 

			mymap.on('mouseup',function(e){
				mymap.dragging.enable();
				mymap.removeEventListener('mousemove');
			})
			
		});
	} else {
		alert("Geolocation not available")

		mymap.setView([48.153644, 17.102378], 14)

		circle = L.circle([48.153644, 17.102378], 1000, {
			color: '#fff',
			fillColor: '#fff',
			fillOpacity: 0.05
		}).addTo(mymap);

		upCentroid = L.circle([yourLat, yourLong], 5, {
			color: '#fff',
			fillColor: '#fff',
			fillOpacity: 1
		}).addTo(mymap);

		circle.on({
			mousedown: function () {
				mymap.dragging.disable();
				mymap.on('mousemove', function (e) {
					circle.setLatLng(e.latlng);
					upCentroid.setLatLng(e.latlng);
				});
			}
		}); 

		mymap.on('mouseup',function(e){
			mymap.dragging.enable();
			mymap.removeEventListener('mousemove');
		})
	}

	/*var mymap = L.map('map').setView([yourLong, yourLat], 14);
	var studioTileLayer = L.tileLayer(
		'https://api.mapbox.com/styles/v1/skodko/cjn0k9qlz4huk2rse71zt319l/tiles/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic2tvZGtvIiwiYSI6ImNqbXFzemhrczFlNWgzcHFjdTFiZDNpYTMifQ.Ea7G79-WcLwk-F6vfKRYuw', {
			maxZoom: 20,
			tileSize: 512,
			zoomOffset: -1,
			attribution: ''
		}).addTo(mymap);*/

		//dark - cjmqv12y0gxle2rnycrgkly9r
		//basic dark - cjmrfhrf30hi12rrys21zdv23
		//final - cjn0k9qlz4huk2rse71zt319l		

	

	

    function position(position) {
	    yourLat = position.coords.latitude;
	    yourLong = position.coords.longitude;
	}

	$(document).on('input', '#slider', function() {

		let val = $(this).val();
		$('#meters').html(val);
		distance = val

		circle.setRadius(parseInt(val));

	    //mymap.removeLayer(circle);

	    /*circle = L.circle([48.152272, 17.069433], parseInt(val), {
			color: 'red',
			fillColor: '#f03',
			fillOpacity: 0.5
		}).addTo(mymap);*/

	});

	$(".open").on('click', () =>{
		$("#rightMenu").animate({ right : "0px"});
	})

	$(".close").on('click', () =>{
		$("#rightMenu").animate({ right : "-450px"});
	})


	$(".open_r").on('click', () =>{
		$(".results").animate({ left : "0px"});
	})

	$(".close_r").on('click', () =>{
		$(".results").animate({ left : "-450px"});
	})

	$("#userDraw").attr("disabled", true)
	$("#removeUserPolygon").attr("disabled", true)
	$("#hideParks").attr("disabled", true)


	let queryResultsOnMap = []

	function drawResults(data){

		let coordinates

		$("#results").html('')

		for(let j = 0; j < queryResultsOnMap.length; j++)
			mymap.removeLayer(queryResultsOnMap[j])

		for(let i = 0; i < data.length; i++){

			coordinates = 0

			let name = data[i].properties.name;
			if(!name) 
				name = 'Let surprise yourself';
			let type = data[i].properties.amenity;
			let dist = data[i].properties.dist;

			let color, clas
			if(type == 'bar'){
				color = '#CCFF00'
				clas = 'bar'
			}
			else if(type == 'pub'){
				color = '#66FF66'
				clas = 'pub'
			}
			else if(type == 'nightclub'){
				color = '#50BFE6'
				clas = 'nightclub'
			}
			else if(type == 'cafe'){
				color = '#FF355E'
				clas = 'cafe'
			}
			else if(type == 'restaurant'){
				color = '#FF00CC'
				clas = 'restaurant'
			}
			else if(type == 'fast_food'){
				color = '#FF9933'
				clas = 'fast'
			}

			let geoType = data[i].type;
			
			if(geoType == "Polygon"){
				
				coordinates = data[i].coordinates[0];
				for(let j = 0; j < coordinates.length; j++)
					coordinates[j].reverse();

				let e = L.polygon(coordinates, {color: color, fillColor: color, fillOpacity: 0.3}).addTo(mymap).bindPopup('<h4>' + name +'</h4><div>Typ podniku:' + type + '</div>');
				queryResultsOnMap.push(e)

				let div = document.createElement('div');
				div.className = 'elm ' + clas
				div.innerHTML = "<div>" + name + "</div><div class=dist> " + dist.toFixed(0) +  " m</div>"
				$(div).attr('data_lat', e.getBounds().getCenter().lat)
				$(div).attr('data_lng', e.getBounds().getCenter().lng)
				$(div).attr('data_name', name)
				$(div).attr('data_type', type)

				$(div).on('click', ()=>{
					popup.setLatLng([$(div).attr('data_lat'),$(div).attr('data_lng')]) 
						 .setContent('<h4>' + $(div).attr('data_name') +'</h4><div>Typ podniku:' + $(div).attr('data_type') + '</div>')
						 .openOn(mymap);
				})

				document.getElementById('results').appendChild(div)

			}
			else if(geoType == 'Point'){

				coordinates = data[i].coordinates.reverse();

				let e = L.circle(coordinates, 5, {color: color, fillColor: color, fillOpacity: 0.3}).addTo(mymap).bindPopup('<h4>' + name +'</h4><div>Typ podniku:' + type + '</div>');
				queryResultsOnMap.push(e)

				let div = document.createElement('div');
				div.className = 'elm ' + clas
				div.innerHTML = "<div>" + name + "</div><div class=dist> " + dist.toFixed(0) +  " m</div>"
				$(div).attr('data_lat', coordinates[0])
				$(div).attr('data_lng', coordinates[1])
				$(div).attr('data_name', name)
				$(div).attr('data_type', type)
				

				$(div).on('click', ()=>{
					popup.setLatLng([$(div).attr('data_lat'),$(div).attr('data_lng')]) 
						 .setContent('<h4>' + $(div).attr('data_name') +'</h4><div>Typ podniku:' + $(div).attr('data_type') + '</div>')
						 .openOn(mymap);
				})

				document.getElementById('results').appendChild(div)
			}

			
			$("#results").append('<hr>')
		}

		$(".results").animate({ left : "0px"});
		
		
	}

	function drawRoads(data){

		if(!data.length){
			$(".pathResHead").text("Path not found")
		}
			
		let total = 0

		for(let i = 0; i < data.length; i++){

			let type = data[i].properties.highway;

			let len = data[i].properties.len;
			total += len

			let coordinates = data[i].coordinates;
			for(let j = 0; j < coordinates.length; j++)
				coordinates[j].reverse();

			let e = L.polyline(coordinates, {color: '#00ff00', fillColor: '#00ff00', fillOpacity: 0.05, weight: 3}).addTo(mymap).bindPopup('<h4>' + type +'</h4><div> ' + total.toFixed(0) + 'm </div>');
			path.push(e)
		}

		if(total)
			$(".pathResHead").text("Path found")
			$("#pathLen").text('Path length ' + total.toFixed(0) + ' m')
			$(".pathRes").animate({ bottom : "-20px"});
	}

	function drawParks(data){

		removeParks()
		parks = []

		$("#results").html('')
		$("#hideParks").removeAttr("disabled")
		$("#walkOff").attr("disabled", true)

		for(let i = 0; i < data.length; i++){

			let type = data[i].type

			if(type == "Polygon"){

				let name = data[i].properties.name
				if(!name)
					name = 'Not named park'
				let area = data[i].properties.area

				let coordinates = data[i].coordinates[0];
				for(let j = 0; j < coordinates.length; j++)
					coordinates[j].reverse();

				let e = L.polygon(coordinates, {color: "#10c100", fillColor: "#10c100", fillOpacity: 0.01, weight: 1}).addTo(mymap).bindPopup('<h4>' + name +'</h4><div>Rozloha: ' + area.toFixed(0) + ' m<sup>2</sup></div>');
				parks.push(e)

				let div = document.createElement('div');
				div.className = 'elm blue'
				div.innerHTML = "<div>" + name + "</div><div class=dist> " + area.toFixed(0) +  " m<sup>2</sup></div>"
				$(div).attr('data_lat', e.getBounds().getCenter().lat)
				$(div).attr('data_lng', e.getBounds().getCenter().lng)
				$(div).attr('data_name', name)
				$(div).attr('data_type', area)

				$(div).on('click', ()=>{
					popup.setLatLng([$(div).attr('data_lat'),$(div).attr('data_lng')]) 
						 .setContent('<h4>' + $(div).attr('data_name') +'</h4><div>Rozloha: ' + area.toFixed(0) + ' m<sup>2</sup></div>')
						 .openOn(mymap);
				})

				document.getElementById('results').appendChild(div)

			} else {

				let len = data[i].properties.length

				let coordinates = data[i].coordinates;
				for(let j = 0; j < coordinates.length; j++)
					coordinates[j].reverse();

				let e = L.polyline(coordinates, {color: '#ce46ca', fillColor: '#ce46ca', fillOpacity: 0.05, weight: 3}).addTo(mymap).bindPopup('<div> ' + len.toFixed(0) + 'm </div>');
				parks.push(e)

			}
			$("#results").append('<hr>')
		}
		$(".results").animate({ left : "0px"});
	}

	function removeParks(){
		for(let i = 0; i < parks.length; i++){
			mymap.removeLayer(parks[i])
		}

		parks = []
		$("#results").html('')
	}

	$('#hideParks').on('click',function(e){
		removeParks()
		
		$("#walkOff").removeAttr("disabled")
		$("#hideParks").attr("disabled", true)
	})

	let upp = [];
	let uppCoord = [];
	let userPolygon;
	let upCentroid;
	let drawing = false;
	let selecting = false
	let filter = ["bar"]
	let inRadius = true
	let distance = 1000
	let markers = []
	let markersCoord = []
	let path = []
	let circle
	let polygonChanged = true
	let parks = []
	
	let SearchArea = {
	    type: "PolygonSearchArea",
	    geometry: {
	        type: "Polygon",
	        coordinates: []
	    },
	    crs:{
	    	type:"name",
	    	properties: {
	    		name:"EPSG:4326"
	    	}
	    }
	};

	function userPolygonClick(e) {
		let c = L.circle(e.latlng, 5, {
			color: '#fff',
			fillColor: '#fff',
			fillOpacity: 0.1
		}).addTo(mymap);

		let coord = [c._latlng.lat, c._latlng.lng]
		upp.push(c);
		uppCoord.push(coord)
	}

	function userMarker(e) {
		
		let m = L.marker(e.latlng).addTo(mymap);
		
		let coord = [m._latlng.lat, m._latlng.lng]
		markers.push(m)
		markersCoord.push(coord)
		
	}

	$('#query').on('click',function(e){
		e.preventDefault();

		let amenities = "("

		for(let i = 0; i < filter.length; i++){
			amenities += "amenity='"
			amenities += filter[i]
			if(i < filter.length - 1)
				amenities += "' or "
			else
				amenities += "') "
		}

		if(!inRadius){

			if(polygonChanged){
				for(let i = 0; i < uppCoord.length; i++)
					uppCoord[i].reverse()

				uppCoord.push(uppCoord[0]) //kvoli uzatvoreniu polygonu
			}

			SearchArea.geometry.coordinates = []
			SearchArea.geometry.coordinates.push(uppCoord);

			let dataFrame = {}
			dataFrame['SearchArea'] = SearchArea
			dataFrame['amenities'] = amenities

			$.ajax({
				url: '/searchInPolygon',
				method: 'GET',
				data: dataFrame,
		        contentType: 'application/json',
				success: function (data) {
					drawResults(data);
				},
				error: function(xhr, desc, err) {
					console.log(xhr);
					console.log("Details: " + desc + "\nError:" + err);
				}
			});

			polygonChanged = false

		} else {

			let coord = {}
			coord.lat = circle.getLatLng().lat;
			coord.lng = circle.getLatLng().lng;

			let dataFrame = {}
			dataFrame['coords'] = coord
			dataFrame['amenities'] = amenities
			dataFrame['distance'] = distance

			$.ajax({
				url: '/searchInRadius',
				method: 'GET',
				data: dataFrame,
		        contentType: 'application/json',
				success: function (data) {
					drawResults(data)
				},
				error: function(xhr, desc, err) {
					console.log(xhr);
					console.log("Details: " + desc + "\nError:" + err);
				}
			});
		}
	});

	$('#path').on('click',function(e){
		e.preventDefault();

		$(".pathRes").animate({ bottom : "-500px"});

		if(!selecting){

			if(markers.length){
				markersCoord = []
				for(let i = 0; i < markers.length; i++)
					mymap.removeLayer(markers[i])
				
				markers = []

				for(let i = 0; i < path.length; i++)
					mymap.removeLayer(path[i])

				path = []
			}

			mymap.on('click', userMarker);
			$('#path').addClass("active");
			$('#path').text("Finish selection");
			selecting = true;
			
		} else {
			mymap.off('click');
			$('#path').removeClass("active");
			$('#path').text("Pathfinder");
			selecting = false;
			

			for(let i = 0; i < markersCoord.length; i++)
				markersCoord[i].reverse()

			SearchArea.geometry.coordinates = []
			SearchArea.geometry.coordinates.push(markersCoord);

			if(markersCoord.length > 0)
				$.ajax({
					url: '/dijkstra',
					method: 'GET',
					data: SearchArea,
			        contentType: 'application/json',
					success: function (data) {
						drawRoads(data);
					},
					error: function(xhr, desc, err) {
						console.log(xhr);
						console.log("Details: " + desc + "\nError:" + err);
					}
				});
		}
		
	});

	$('#walkOff').on('click',function(e){
		e.preventDefault();

		$.ajax({
			url: '/walkoff',
			method: 'GET',
			data: SearchArea,
	        contentType: 'application/json',
			success: function (data) {
				drawParks(data);
			},
			error: function(xhr, desc, err) {
				console.log(xhr);
				console.log("Details: " + desc + "\nError:" + err);
			}
		});
		
	});

	$('#userDraw').on('click',function(e){
		e.preventDefault();
		
		polygonChanged = true

		if(!drawing){
			mymap.on('click', userPolygonClick);
			$('#userDraw').addClass("active");
			$('#userDraw').text("Finish drawing");
			drawing = true;
			if(userPolygon){

				mymap.removeLayer(userPolygon)
				mymap.removeLayer(upCentroid)

				for (let i = 0; i < upp.length; i++) {  
				  mymap.removeLayer(upp[i])
				}

				upp = []
				uppCoord = []
			}
			

		} else {
			mymap.off('click');
			$('#userDraw').removeClass("active");
			$('#userDraw').text("Draw area");
			drawing = false;
			userPolygon = L.polygon(uppCoord, {color: '#fff', fillColor: '#fff', fillOpacity: 0.1}).addTo(mymap);
			upCentroid = L.circle([userPolygon.getBounds().getCenter().lat, userPolygon.getBounds().getCenter().lng], 5, {
				color: '#fff',
				fillColor: '#fff',
				fillOpacity: 1
			}).addTo(mymap);
		}
	});

	$('#removeUserPolygon').on('click',function(e){
		e.preventDefault();

		if(userPolygon){

			mymap.removeLayer(userPolygon)
			mymap.removeLayer(upCentroid)

			for (let i = 0; i < upp.length; i++) {  
			  mymap.removeLayer(upp[i])
			}

			upp = []
			uppCoord = []
		}

	}); 

	$( ".chckbx" ).each(function(index) {
	    $(this).on("click", function(){
	        $(this).find("input").click(()=>{
				let $chckbx = $(this).find("input")

				let found = $.inArray($chckbx.val(), filter);
				if (found >= 0) {
				    filter.splice(found, 1);
				} else {
				    filter.push($chckbx.val());
				}
			})
	    });
	});


	$("#searchSelector").change(()=>{
		if(inRadius){
			inRadius = false
			mymap.removeLayer(circle)
			mymap.removeLayer(upCentroid)
			
			$("#userDraw").removeAttr("disabled")
			$("#removeUserPolygon").removeAttr("disabled")

		} else {
			inRadius = true

			$("#userDraw").attr("disabled", true)
			$("#removeUserPolygon").attr("disabled", true)

			circle = L.circle([yourLat, yourLong], 1000, {
				color: '#fff',
				fillColor: '#fff',
				fillOpacity: 0.05
			}).addTo(mymap);

			upCentroid = L.circle([yourLat, yourLong], 5, {
				color: '#fff',
				fillColor: '#fff',
				fillOpacity: 1
			}).addTo(mymap);

			circle.on({
				mousedown: function () {
					mymap.dragging.disable();
					mymap.on('mousemove', function (e) {
						circle.setLatLng(e.latlng);
						upCentroid.setLatLng(e.latlng);
					});
				}
			}); 
		}
	})

});