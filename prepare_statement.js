function polygonQuery(userPolygon, amenities) {
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
					select source FROM network ORDER BY st_distance(st_transform(way,4326), ST_SetSRID(st_makepoint(${s1}, ${s2}), 4326)) limit 1), 
				endPoint as (
					select target FROM network ORDER BY st_distance(st_transform(way,4326), ST_SetSRID(st_makepoint(${e1}, ${e2}), 4326)) limit 1)
				select st_length(way) as len, highway, st_asgeojson(st_transform(way,4326)) as gmt 
				from pgr_dijkstra('select osm_id as id, source, target, st_length(way) as cost from network', 
					(select * from startPoint), (select * from endPoint), false) as tbl 
				join network on tbl.edge = network.osm_id`

	return query
}

function walkOff() {
	let query = `with sub as(
					select name, polygon, area, line, len as len from (
						(select name as name, way as polygon, st_area(way) as area from planet_osm_polygon as pl 
							where pl.leisure='park' 
							and ST_Distance(ST_GeomFromText('POINT(17.102378 48.153644)', 4326)::geography, ST_Transform(pl.way, 4326)::geography) < 8000) as polygons

						cross join

						(select way as line, st_length(way) as len from planet_osm_line as ln 
							where (ln.highway='footway' or ln.highway='path') 
							and ST_Distance(ST_GeomFromText('POINT(17.102378 48.153644)', 4326)::geography, ST_Transform(ln.way, 4326)::geography) < 8000) as lns) as lines

					where st_crosses(polygon, line)) 

					select name, ST_AsGeoJSON(ST_Transform(sub.polygon, 4326)) as polygon, area*POWER(0.3048,2) as area, ST_AsGeoJSON(ST_Transform(line, 4326)) as line, len from sub 
					inner join 
					(select polygon, max(len) as mx from sub 
					group by polygon) as subsub 
					on sub.polygon = subsub.polygon 
					and sub.len = subsub.mx
					order by area desc`

	return query
}

module.exports.polygonQuery = polygonQuery
module.exports.radiusQuery = radiusQuery
module.exports.dijkstra = dijkstra
module.exports.walkOff = walkOff