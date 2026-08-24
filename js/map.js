var map;
var markers = L.markerClusterGroup({
	spiderfyOnMaxZoon: false,
	showCoverageOnHover: false,
	zoomToBoundsOnClick: true
});

async function populate_feature(feature)
{
	var url = 'data/' + feature.properties.name + '.json';
	$.ajax({
		url: url,
		async: true,
		success: function(data) {
			markers.addLayer(L.geoJSON(data, {
				minZoom: 10,
				pointToLayer: function(feature, latlng) {
					return L.circleMarker(latlng, {
						radius: 6,
						fillColor: '#007FFF',
						color: '#007FFF',
						weight: 1,
						fillOpacity: 0.9
					});
				},
				style: function(feature) {
					return { stroke: true, fill: true, color: '#007FFF', fillColor: '#007FFF', weight: 1, fillOpacity: 0.9 }
				},
				onEachFeature(feature, layer) {
					layer.bindPopup('<h1>' + feature.properties.label + '</h1><div class="popuplinks"> <a href="' + feature.properties.url + '">Report</a> <a href="' + feature.properties.edit_url + '">Edit</a> </p>');
				}
			}));
		}
	});
}

function get_grids_geojson()
{
	var ret = {};
	$.ajax({
		url: 'data/grids.json',
		async: false,
		success: function(data) { ret = data; }
	});
	return ret;
}

$(document).ready(function()
{

	var grids = L.geoJSON(get_grids_geojson(), {
		style: function(feature) {
			populate_feature(feature);
			return {
				stroke: true, fill: true, color: '#000000', fillColor: '#007F00', fillOpacity: 0.2, weight: 1
			}
		},
		onEachFeature(feature, layer) {
			layer.bindPopup('<h1>' + feature.properties.name + '</h1><p><a href="' + feature.properties.url + '">View statistics</a></p>');
		}
	});

	// Create the map object with some sensible defaults
	map = L.map('map', {
		center: [0, 0],
		zoom: 17,
		maxZoom: 20,
		zoomControl: false
	});
	map.fitBounds(grids.getBounds());
    L.tileLayer('https://tiles.flarpyland.com/lite/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
	grids.addTo(map);
	markers.addTo(map);
	new L.Control.Zoom({ position: 'bottomright' }).addTo(map);
});
