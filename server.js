const express = require('express')
const bp = require('body-parser')
const path = require('path')
const pg = require('pg')
const queryBuilder = require("./prepare_statement.js");
const app = express()
const port = 1000
const pool = new pg.Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'gisdb',
	password: '12345',
	port: '5432'
});

let rows;

app.use(bp.json());
app.use(bp.urlencoded({ extended: false }));

app.get('/', (req, res) => {
	app.use(express.static(__dirname + '/assets'));
	res.sendFile(path.join(__dirname + '/views/index.html'));
})	

app.get('/searchInPolygon', async (request, result) => {

	let userPolygon = {}
	userPolygon['type'] = request.query.SearchArea.geometry.type
	userPolygon['coordinates'] = request.query.SearchArea.geometry.coordinates
	userPolygon['crs'] = request.query.SearchArea.crs

	let amenities = request.query.amenities

	await pool.query(queryBuilder.polygonQuery(userPolygon, amenities), (err, res) => {
		rows = res.rows;
		result.send(rows);
	});

})

app.get('/searchInRadius', async (request, result) => {

	let amenities = request.query.amenities
	let lng = request.query.coords.lng
	let lat = request.query.coords.lat
	let distance = request.query.distance

	await pool.query(queryBuilder.radiusQuery(lng, lat, amenities, distance), (err, res) => {
		rows = res.rows;
		result.send(rows);
	});

})


let fullPath = []

app.get('/dijkstra', async (request, result) => {

	fullPath = []	

    for(let i = 0; i < request.query.geometry.coordinates[0].length - 1; i++){

		let start = request.query.geometry.coordinates[0][i]
		let end = request.query.geometry.coordinates[0][i+1]

		pool.query(queryBuilder.dijkstra(start[0], start[1], end[0], end[1]), (err, res) => {
			fullPath = fullPath.concat(res.rows);
			//pool.end();
			if(i == request.query.geometry.coordinates[0].length - 2){
				result.send(fullPath);
			}
		});

	}	

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

//osm2pgsql -c -d blava -W -U postgres -H localhost -S default.style map -r osm