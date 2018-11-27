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

const knex = require('knex')({
  client: 'pg',
  version: '7.2',
  debug: true,
  connection: {
    user: 'postgres',
	host: 'localhost',
	database: 'gisdb',
	password: '12345',
	port: '5432'
  }
});


let rows = [];

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

	userPolygon = "'" + JSON.stringify(userPolygon) + "'"

	knex.select(knex.raw(`st_distance(ST_PointFromText(ST_AsText(ST_Centroid(ST_GeomFromGeoJSON(${userPolygon}))), 4326)::geography ,ST_Transform(way, 4326)) as dist, amenity, name, ST_AsGeoJSON(ST_Transform(way, 4326)) as gmt`))
		.from(function(){
			this.select(knex.raw('pol.amenity, pol.way, pol.name from planet_osm_polygon pol'))
			.union(function(){
				this.select(knex.raw('point.amenity, point.way, point.name from planet_osm_point point'))}).as('tbl')
		}).where(knex.raw(`${amenities}`))
		.andWhere(knex.raw(`st_contains(ST_GeomFromGeoJSON(${userPolygon}), ST_Transform(way, 4326)) `))
		.orderBy(knex.raw(`st_distance(ST_PointFromText(ST_AsText(ST_Centroid(ST_GeomFromGeoJSON(${userPolygon}))), 4326)::geography ,ST_Transform(way, 4326))`))
	.then((rr) => {
	    for (row of rr) {
	        row.gmt = JSON.parse(row.gmt)
			row.gmt['properties'] = {'name':row.name, 'amenity':row.amenity, 'dist':row.dist}
			rows.push(row.gmt)
	    }
	    result.send(rows);
		rows = []
	})
	.catch((err) => { 
		console.log( err); throw err 
	})

	/*await pool.query(queryBuilder.polygonQuery(userPolygon, amenities), (err, res) => {

		for(i = 0; i < res.rows.length; i++){
			row = res.rows[i]
			row.gmt = JSON.parse(row.gmt)
			row.gmt['properties'] = {'name':row.name, 'amenity':row.amenity, 'dist':row.dist}
			rows.push(row.gmt)
		}

		result.send(rows);
		rows = []
	});*/

})

app.get('/searchInRadius', async (request, result) => {

	let amenities = request.query.amenities
	let lng = request.query.coords.lng
	let lat = request.query.coords.lat
	let distance = request.query.distance

	knex.select(knex.raw(`ST_distance(ST_SetSRID(st_makepoint(${lng}, ${lat}), 4326)::geography,ST_Transform(way, 4326)) as dist, amenity, name, ST_AsGeoJSON(ST_Transform(way, 4326)) as gmt, way `))
		.from(function(){
			this.select(knex.raw('pol.amenity, pol.way, pol.name from planet_osm_polygon pol'))
			.union(function(){
				this.select(knex.raw('point.amenity, point.way, point.name from planet_osm_point point'))}).as('tbl')
		}).where(knex.raw(`${amenities}`))
		.andWhere(knex.raw(`ST_DWithin(ST_SetSRID(st_makepoint(${lng}, ${lat}), 4326)::geography, ST_Transform(way, 4326)::geography, ${distance})`))
		.orderBy(knex.raw(`ST_distance(ST_SetSRID(st_makepoint(${lng}, ${lat}), 4326)::geography,ST_Transform(way, 4326))`))
	.then((rr) => {
	    for (row of rr) {
	        row.gmt = JSON.parse(row.gmt)
			row.gmt['properties'] = {'name':row.name, 'amenity':row.amenity, 'dist':row.dist}
			rows.push(row.gmt)
	    }
	    result.send(rows);
		rows = []
	})
	.catch((err) => { 
		console.log( err); throw err 
	})

	/*await pool.query(queryBuilder.radiusQuery(lng, lat, amenities, distance), (err, res) => {

		for(i = 0; i < res.rows.length; i++){
			row = res.rows[i]
			row.gmt = JSON.parse(row.gmt)
			row.gmt['properties'] = {'name':row.name, 'amenity':row.amenity, 'dist':row.dist}
			rows.push(row.gmt)
		}

		result.send(rows);
		rows = []
	});*/

})



let fullPath = []

app.get('/dijkstra', async (request, result) => {

	fullPath = []

    for(let i = 0; i < request.query.geometry.coordinates[0].length - 1; i++){

		let start = request.query.geometry.coordinates[0][i]
		let end = request.query.geometry.coordinates[0][i+1]

		/* not working
		knex.with('startPoint', (qb) => qb.select(knex.raw(`source FROM network ORDER BY st_distance(st_transform(way,4326), ST_SetSRID(st_makepoint(${start[0]}, ${start[1]}), 4326)) limit 1)`))
			.with('endPoint', (qb) => qb.select(knex.raw(`target FROM network ORDER BY st_distance(st_transform(way,4326), ST_SetSRID(st_makepoint(${end[0]}, ${end[1]}), 4326)) limit 1)`))
			.select(knex.raw(`st_length(way) as len, highway, st_asgeojson(st_transform(way,4326)) as gmt from pgr_dijkstra('select osm_id as id, source, target, st_length(way) as cost from network', 
							(select * from startPoint), (select * from endPoint), false) as tbl 
						join network on tbl.edge = network.osm_id`))
			.then((rr) => {
			    for (row of rr) {
			    	console.log(row)
			        row.gmt = JSON.parse(row.gmt)
					row.gmt['properties'] = {'len':row.len, 'highway':row.highway}
					rows.push(row.gmt)
			    }
			    result.send(rows);
				rows = []
			})
			.catch((err) => { 
				console.log( err); throw err 
			})*/

		pool.query(queryBuilder.dijkstra(start[0], start[1], end[0], end[1]), (err, res) => {
			
			for(let j = 0; j < res.rows.length; j++){
				row = res.rows[j]
				row.gmt = JSON.parse(row.gmt)
				row.gmt['properties'] = {'len':row.len, 'highway':row.highway}
				fullPath.push(row.gmt)
			}
			
			if(i == request.query.geometry.coordinates[0].length - 2){
				result.send(fullPath);
			}
		});

	}	

})

app.get('/walkoff', async (request, result) => {

	rows = []

	/* not working
	knex.with('sub', (qb) => qb.select('name, polygon, area, line, len as len')
	.from(function(){
		this.select(knex.raw(`name as name, way as polygon, st_area(way) as area from planet_osm_polygon as pl`))
		.where('pl.leisure', 'park')}))
		.andWhere(knex.raw(`and ST_Distance(ST_GeomFromText('POINT(17.102378 48.153644)', 4326)::geography, ST_Transform(pl.way, 4326)::geography) < 8000) as polygons`))
		.joinRaw('ln', (qb) => qb.knex.raw(`select way as line, st_length(way) as len from planet_osm_line as ln`))
		.where(knex.raw(`ln.highway='footway' or ln.highway='path'`))
		.andWhere(knex.raw(`ST_Distance(ST_GeomFromText('POINT(17.102378 48.153644)', 4326)::geography, ST_Transform(ln.way, 4326)::geography) < 8000) as lns) as lines`))
	.where(knex.raw(`st_crosses(polygon, line))`))
	.select(knex.raw(`name, ST_AsGeoJSON(ST_Transform(sub.polygon, 4326)) as polygon, area*POWER(0.3048,2) as area, ST_AsGeoJSON(ST_Transform(line, 4326)) as line, len from sub`))
	.joinRaw(knex.raw(`select polygon, max(len) as mx from sub group by polygon`).as('sub'))
	.where(`sub.polygon`, `subsub.polygon`)
	.andWhere(`sub.len`, `subsub.mx`)
	.orderBy(`area`, `desc`)

	.then((rr) => {
	    for (row of rr) {
	        row.gmt = JSON.parse(row.gmt)
			row.gmt['properties'] = {'name':row.name, 'amenity':row.amenity, 'dist':row.dist}
			rows.push(row.gmt)
	    }
	    result.send(rows);
		rows = []
	})
	.catch((err) => { 
		console.log( err); throw err 
	})*/

	await pool.query(queryBuilder.walkOff(), (err, res) => {
		for(let j = 0; j < res.rows.length; j++){
			row = res.rows[j]
			let polygon = JSON.parse(row.polygon)
			let line = JSON.parse(row.line)
			polygon['properties'] = {'name': row.name, 'area': row.area}
			line['properties'] = {'length': row.len}
			rows.push(polygon)
			rows.push(line)
		}
		result.send(rows);
	});

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

//osm2pgsql -c -d blava -W -U postgres -H localhost -S default.style map -r osm