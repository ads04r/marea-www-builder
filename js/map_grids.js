/**
 * Defines the grid squares and sites Layers
 * @constructor
 */

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

function GridSquaresFeatureSet()
{
	FeatureSet.call(this);
	this.layer = [];
    this.markers = L.markerClusterGroup({
        spiderfyOnMaxZoon: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });
    var me = this;
	this.init = function()
	{
        this.layer = L.geoJSON(get_grids_geojson(), {
            style: function(feature) {
                var url = 'data/' + feature.properties.name + '.json';
                $.ajax({
                    url: url,
                    async: true,
                    success: function(data) {
                        me.markers.addLayer(L.geoJSON(data, {
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
                return {
                    stroke: true, fill: true, color: '#000000', fillColor: '#007F00', fillOpacity: 0.2, weight: 1
                }
            },
            onEachFeature(feature, layer) {
                layer.bindPopup('<h1>' + feature.properties.name + '</h1><p><a href="' + feature.properties.url + '">View statistics</a></p>');
            }
        });
        map.addLayer(this.layer);
        map.addLayer(this.markers);
	}
	this.title = function() { return("Completed Grids / Sites"); }
	this.description = function() { return("Displays all sites that MarEA have created, and the grid squares that they are within."); }
	this.show = function()
	{
		map.addLayer(this.layer);
        map.addLayer(this.markers);
	}
	this.hide = function()
	{
		map.removeLayer(this.layer);
        map.removeLayer(this.markers);
	}
	this.update = function()
	{
	}
}
GridSquaresFeatureSet.prototype = Object.create(FeatureSet.prototype);
FSREG.addFeatureSet('grid_squares', new GridSquaresFeatureSet());
