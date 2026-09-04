function get_coast_geojson()
{
	var ret = {};
	$.ajax({
		url: 'data/coast_buffer.json',
		async: false,
		success: function(data) { ret = data; }
	});
	return ret;
}

function CoastBufferFeatureSet()
{
	FeatureSet.call(this);
	this.layer = [];
    var me = this;
	this.init = function()
	{
        this.layer = L.geoJSON(get_coast_geojson(), {
            style: function(feature) {
                return {
                    stroke: true, fill: true, color: '#0000FF', fillColor: '#7FAFFF', fillOpacity: 0.2, weight: 1
                }
            }
        });
	}
	this.title = function() { return("Coastal Buffer"); }
	this.description = function() { return("Displays a perimiter line 2km from the coast, marking MarEA's remit."); }
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
CoastBufferFeatureSet.prototype = Object.create(FeatureSet.prototype);
FSREG.addFeatureSet('coast_buffer', new CoastBufferFeatureSet());
