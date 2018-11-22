function polygonQuery(userPolygon, amenities) {
	userPolygon =  "'" + JSON.stringify(userPolygon) + "'"
	let query = `select st_distance(ST_PointFromText(ST_AsText(ST_Centroid(ST_GeomFromGeoJSON(${userPolygon}))), 4326)::geography ,ST_Transform(way, 4326)) as dist, amenity, name, ST_AsGeoJSON(ST_Transform(way, 4326)) as gmt 
					from (
						select pol.amenity, pol.way, pol.name from planet_osm_polygon pol 
						union 
						select point.amenity, point.way, point.name from planet_osm_point point) as tbl 
					where ${amenities} 
					and st_contains(ST_GeomFromGeoJSON(${userPolygon}), ST_Transform(way, 4326)) 
					order by st_distance(ST_PointFromText(ST_AsText(ST_Centroid(ST_GeomFromGeoJSON(${userPolygon}))), 4326)::geography ,ST_Transform(way, 4326))`

	return query
}

function radiusQuery(lng, lat, amenities, distance) {
	let query = `select ST_distance(ST_SetSRID(st_makepoint(${lng}, ${lat}), 4326)::geography,ST_Transform(way, 4326)) as dist, amenity, name, ST_AsGeoJSON(ST_Transform(way, 4326)) as gmt, way 
					from (
						select pol.amenity, pol.way, pol.name from planet_osm_polygon pol 
						union 
						select point.amenity, point.way, point.name from planet_osm_point point) as tbl 
					where ${amenities} 
					and ST_DWithin(ST_SetSRID(st_makepoint(${lng}, ${lat}), 4326)::geography, ST_Transform(way, 4326)::geography, ${distance}) 
					order by ST_distance(ST_SetSRID(st_makepoint(${lng}, ${lat}), 4326)::geography,ST_Transform(way, 4326))`

	return query
}

function dijkstra(s1, s2, e1, e2) {
	let query = `with 
				startPoint as (
					SELECT source FROM network ORDER BY st_distance(st_transform(way,4326), ST_SetSRID(st_makepoint(${s1}, ${s2}), 4326)) limit 1), 
				endPoint as (
					SELECT target FROM network ORDER BY st_distance(st_transform(way,4326), ST_SetSRID(st_makepoint(${e1}, ${e2}), 4326)) limit 1)

				select st_length(way) as len, highway, st_asgeojson(st_transform(way,4326)) as gmt 
				FROM pgr_dijkstra('SELECT osm_id as id, source, target, st_length(way) as cost FROM network', 
					(select * from startPoint), (select * from endPoint), false) as tbl 
				join network on tbl.edge = network.osm_id`

	return query
}

module.exports.polygonQuery = polygonQuery
module.exports.radiusQuery = radiusQuery
module.exports.dijkstra = dijkstra