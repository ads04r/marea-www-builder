function get_unfinished_grids_geojson()
{
	var ret = {};
	$.ajax({
		url: 'data/unfinished_marea_grids.json',
		async: false,
		success: function(data) { ret = data; }
	});
	return ret;
}

function UnfinishedGridSquaresFeatureSet()
{
	FeatureSet.call(this);
	this.layer = [];
    var me = this;
	this.init = function()
	{
        this.layer = L.geoJSON(get_unfinished_grids_geojson(), {
            style: function(feature) {
                var url = 'data/' + feature.properties.name + '.json';
                return {
                    stroke: true, fill: true, color: '#000000', fillColor: '#FF7F7F', fillOpacity: 0.2, weight: 1
                }
            },
            onEachFeature(feature, layer) {
                layer.bindPopup('<h1>' + feature.properties.name + '</h1>' + feature.properties.html);
            }
        });
	}
	this.title = function() { return("Incomplete Grids"); }
	this.description = function() { return("Displays all grid squares within MarEA's remit that do not yet have any sites documented."); }
	this.show = function()
	{
		map.addLayer(this.layer);
	}
	this.hide = function()
	{
		map.removeLayer(this.layer);
	}
	this.update = function()
	{
	}
    this.startsVisible = function() { return false; }
}
UnfinishedGridSquaresFeatureSet.prototype = Object.create(FeatureSet.prototype);
FSREG.addFeatureSet('unfinished_grid_squares', new UnfinishedGridSquaresFeatureSet());
