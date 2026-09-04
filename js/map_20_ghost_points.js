function get_ghost_geojson()
{
	var ret = {};
	$.ajax({
		url: 'data/ghost_points.json',
		async: false,
		success: function(data) { ret = data; }
	});
	return ret;
}

function GhostPointFeatureSet()
{
	FeatureSet.call(this);
	this.layer = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster)
        {                
            var childCount = cluster.getChildCount();

            var c = ' marker-cluster-';
            if (childCount < 10) {
                c += 'small';
            } else if (childCount < 100) {
                c += 'medium';
            } else {
                c += 'large';
            }

            return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster-error marker-cluster' + c, iconSize: new L.Point(40, 40) });
        }
    });
    var me = this;
	this.init = function()
	{
        this.layer.addLayer(L.geoJSON(get_ghost_geojson(), {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: '#7F0000',
                    color: '#FF0000',
                    weight: 1,
                    fillOpacity: 0.9
                });
            },
            style: function(feature) {
                return {
                    stroke: true, fill: true, color: '#FF0000', fillColor: '#FF7F7F', fillOpacity: 0.2, weight: 1
                }
            }, 
            onEachFeature(feature, layer) {
                layer.bindPopup('<h1>' + feature.properties.name + '</h1><div class="popuplinks"> <a target="_blank" class="btn btn-primary" href="' + feature.properties.url + '">View</a> <a target="_blank" class="btn btn-secondary" href="' + feature.properties.edit_url + '">Edit</a> </p>');
            }
        }));
	}
	this.title = function() { return("Ghost Points"); }
	this.description = function() { return("Displays the items in the EAMENA database with no data attached to them."); }
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
GhostPointFeatureSet.prototype = Object.create(FeatureSet.prototype);
FSREG.addFeatureSet('ghost_points', new GhostPointFeatureSet());
